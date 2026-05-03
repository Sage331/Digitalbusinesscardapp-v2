export interface SocialLink {
  platform: string; // Allow any string from the scanner
  url: string;
}

import { FontAwesome5 } from '@expo/vector-icons';

export interface UserEmail {
  type: 'personal' | 'work' | 'other';
  address: string;
}

export const SUPPORTED_SOCIALS: Record<string, { icon: string; color: string }> = {
  linkedin: { icon: 'linkedin', color: '#0077B5' },
  x: { icon: 'twitter', color: '#000000' },
  github: { icon: 'github', color: '#181717' },
  facebook: { icon: 'facebook', color: '#1877F2' },
  youtube: { icon: 'youtube', color: '#FF0000' },
  whatsapp: { icon: 'whatsapp', color: '#25D366' },
  instagram: { icon: 'instagram', color: '#E4405F' },
  other: { icon: 'link', color: '#94a3b8' }
};

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  title: string;
  company?: string;
  email: string;
  phone: string;
  cardName?: string;
  bio?: string;
  profileImage: string | null;
  photo?: string; 
  language?: string; 
  onboardingComplete?: boolean;
  isViewingQR?: boolean;
  hasSeenTour: boolean
  phones?: string[]; 
  emails?: any[];  
  address?: string; 
  website?: string;
  links?: SocialLink[]; 
  cards?: UserProfile[];


  metadata?: Record<string, any>; 
}

export interface Contact {
  id: string;
  profile: UserProfile;
  notes: string;
  qrNote?: string;
  placeMet: string;
  placeMetAuto: string; // Automatically captured location
  dateMet: string;
  metadata: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tags: string[];
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
];