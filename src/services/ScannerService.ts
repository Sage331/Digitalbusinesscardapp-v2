// src/services/ScannerService.ts
import { UserProfile, SUPPORTED_SOCIALS } from '../types';

export interface ParsedResult {
  profile: Partial<UserProfile>;
  connectMeId: string | null;
  isValid: boolean; // ✅ Validation Gate
}

export class ScannerService {
  static parse(rawData: string): ParsedResult {
    const cleanData = rawData.trim();
    let profile: any = { links: [], emails: [], metadata: {} };
    let connectMeId: string | null = null;

    // 1. Extract ConnectMeID immediately
    const idMatch = cleanData.match(/ConnectMeID:([a-zA-Z0-9_-]+)/i);
    if (idMatch) connectMeId = idMatch[1];

    // 2. Structural Parsing (vCard or MeCard)
    const lines = cleanData.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (cleanData.toUpperCase().includes('BEGIN:VCARD')) {
      profile = this.parseVCard(lines, !!connectMeId);
    } else if (cleanData.toUpperCase().startsWith('MECARD:')) {
      profile = this.parseMeCard(cleanData);
    }

    // 3. 🧠 SMART PATTERN HUNTING (For Plain Text or Missing Tags)
    if (!profile.email) {
      const emailMatch = cleanData.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        profile.email = emailMatch[0];
        profile.emails = [{ type: 'work', address: emailMatch[0] }];
      }
    }

    if (!profile.phone) {
      const phoneMatch = cleanData.match(/(\+?\d{1,4}?[\s.-]?\(?\d{1,3}?\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9})/);
      if (phoneMatch && phoneMatch[0].length > 8) profile.phone = phoneMatch[0];
    }

    const urlMatch = cleanData.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) { profile.links.push({ platform: this.detectPlatform(urlMatch[0]), url: urlMatch[0] });}

    // 4. 🛡️ VALIDATION & IDENTITY FALLBACK
    return this.validateAndFinalize(profile, connectMeId);
  }

  private static validateAndFinalize(profile: any, id: string | null): ParsedResult {
    // A scan is VALID only if it has an Email, Phone, or Website/Social Link
    const hasEmail = !!profile.email;
    const hasPhone = !!profile.phone;
    const hasLink = profile.links && profile.links.length > 0;
    
    const isValid = hasEmail || hasPhone || hasLink;

    // 👤 SMART IDENTITY: If name is missing, use fallbacks
    if (!profile.firstName || profile.firstName.trim() === "") {
      if (profile.email) {
        profile.firstName = profile.email.split('@')[0];
        profile.lastName = "Email";
      } else if (profile.company) {
        profile.firstName = "Contact at";
        profile.lastName = profile.company;
      } else {
        profile.firstName = "New";
        profile.lastName = "Connection";
      }
    }

    return { profile, connectMeId: id, isValid };
  }

  private static parseVCard(lines: string[], isConnectMeUser: boolean = false): Partial<UserProfile> {
    const profile: any = { 
      links: [], 
      emails: [], 
      phones: [], 
      metadata: {} 
    };

    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;
      
      const header = line.slice(0, colonIndex).toUpperCase();
      const val = line.slice(colonIndex + 1).trim();
      if (!val) return;

      const key = header.split(';')[0];

      switch (key) {
        case 'FN':
          const parts = val.split(' ');
          const hasPrefix = ['MR', 'MRS', 'MS', 'DR'].includes(parts[0].replace('.', ''));
          profile.firstName = hasPrefix ? (parts[1] || parts[0]) : parts[0];
          profile.lastName = hasPrefix ? parts.slice(2).join(' ') : parts.slice(1).join(' ');
          break;

        case 'N':
          const nParts = val.split(';');
          if (!profile.lastName) profile.lastName = nParts[0] || '';
          if (!profile.firstName) profile.firstName = nParts[1] || '';
          break;

        case 'TEL':
          if (!profile.phone) profile.phone = val;
          profile.phones.push(val);
          break;

        case 'EMAIL': 
          if (!profile.email) profile.email = val;
          profile.emails.push({ type: 'work', address: val });
          break;

        case 'ORG': 
          profile.company = val.replace(/;/g, ' ').trim(); 
          break;

        case 'TITLE': 
          profile.title = val; 
          break;

        case 'URL': 
          profile.links.push({ platform: this.detectPlatform(val), url: val });
          break;

        case 'ADR': 
          // 🚀 FIX: Map the clean address to metadata so the UI renders it in "Additional Info"
          const cleanAddress = val.split(';').filter(p => p.trim().length > 0).join(', '); 
          profile.metadata['location'] = cleanAddress;
          break;

        case 'NOTE':
          if (val.includes('ConnectMeID:')) {
            const idMatch = val.match(/ConnectMeID:([a-zA-Z0-9_-]+)/i);
            if (idMatch) profile.connectMeId = idMatch[1];
            
            const cleanBio = val.replace(/ConnectMeID:[a-zA-Z0-9_-]+/i, '').replace(/\|/g, '').trim();
            if (cleanBio) profile.bio = cleanBio; 
          } else {
            profile.bio = val;
          }
          break;

        case 'BDAY':
          profile.birthday = val;
          break;

        case 'NICKNAME':
          profile.nickname = val;
          break;

        default:
          if (key.startsWith('X-')) {
            const detected = this.detectPlatform(val);
            profile.links.push({ platform: detected, url: val });
          } else {
            if (isConnectMeUser && ['BEGIN', 'VERSION', 'END'].includes(key)) {
              return; 
            }
            profile.metadata[key.toLowerCase()] = val;
          }
          break;
      }
    });

    return profile;
  }

  private static detectPlatform(url: string): string {
    const lowercaseUrl = url.toLowerCase();
    const detected = Object.keys(SUPPORTED_SOCIALS).find(key => 
      key !== 'other' && lowercaseUrl.includes(key)
    );
    return detected || 'other'; 
  }

  // 🚀 FULL REWRITE: MECARD parser now loops and captures ALL data like the vCard parser does
  private static parseMeCard(data: string): Partial<UserProfile> {
    const profile: any = { links: [], emails: [], metadata: {} };
    const cleanData = data.replace(/^MECARD:/i, '');
    
    // MECARD splits distinct fields with a semicolon
    const parts = cleanData.split(';');
    
    parts.forEach(part => {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) return;

      const key = part.substring(0, colonIdx).toUpperCase();
      // Using substring instead of split ensures we don't break URLs containing colons
      const val = part.substring(colonIdx + 1).trim();

      if (!val) return;

      switch (key) {
        case 'N':
          if (val.includes(',')) {
            const nameParts = val.split(',');
            profile.lastName = nameParts[0].trim();
            profile.firstName = nameParts[1]?.trim() || '';
          } else {
            profile.firstName = val;
          }
          break;
        case 'TEL':
          if (!profile.phone) profile.phone = val;
          break;
        case 'EMAIL':
          if (!profile.email) profile.email = val;
          profile.emails.push({ type: 'work', address: val });
          break;
        case 'URL':
          profile.links.push({ platform: this.detectPlatform(val), url: val });
          break;
        case 'ORG':
          profile.company = val;
          break;
        case 'TIL': // MECARD uses TIL for Title
          profile.title = val;
          break;
        case 'NOTE':
          profile.bio = val;
          break;
        case 'ADR':
          // 🚀 FIX: Formats the MECARD address and assigns it to location metadata
          const cleanAdr = val.replace(/,/g, ', ').replace(/\s+/g, ' '); 
          profile.metadata['location'] = cleanAdr;
          break;
        default:
          // 📥 CATCH-ALL: Push anything unexpected into metadata
          profile.metadata[key.toLowerCase()] = val;
          break;
      }
    });
    
    return profile;
  }
}