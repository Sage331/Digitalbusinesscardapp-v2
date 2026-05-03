import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Linking,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  X, Mail, UserPlus, Phone,
  CheckCircle, MapPin, Download 
} from 'lucide-react-native'; 
import { FontAwesome5 } from '@expo/vector-icons';
import { Contact, SUPPORTED_SOCIALS } from '../types';
import * as Contacts from 'expo-contacts';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Global Theme Sync

interface ContactCardProps {
  isVisible: boolean;
  contact: Contact | null;
  contacts: Contact[];
  onSave: (contact: Contact) => void;
  onCancel: () => void;
}

export function ContactCard({ isVisible, contact, contacts, onSave, onCancel }: ContactCardProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Hooked into Central Theme
  const { theme, isDark } = useTheme();
  
  if (!isVisible || !contact || !contact.profile) return null;
  
  const profile = contact.profile;
  const isAlreadySaved = contacts.some((c: Contact) => c.id === contact.id);
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();

  const handleSaveToNativeContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Permission to access contacts was denied');
        return;
      }

      const nativeContact: any = {
        [Contacts.Fields.FirstName]: profile.firstName,
        [Contacts.Fields.LastName]: profile.lastName,
        [Contacts.Fields.JobTitle]: profile.title || '',
        [Contacts.Fields.Company]: profile.company || '',
        [Contacts.Fields.PhoneNumbers]: profile.phones?.length 
          ? profile.phones.map((n: string) => ({ number: n, label: 'mobile' }))
          : (profile.phone ? [{ number: profile.phone, label: 'mobile' }] : []),
        [Contacts.Fields.Emails]: profile.emails?.length
          ? profile.emails.map((e: any) => ({ email: e.address || e, label: 'work' }))
          : (profile.email ? [{ email: profile.email, label: 'work' }] : []),
        [Contacts.Fields.UrlAddresses]: profile.website ? [{ url: profile.website, label: 'other' }] : [],
        [Contacts.Fields.Note]: `Met via ConnectMe on ${new Date().toLocaleDateString()}.`,
      };

      if (profile.address) {
        nativeContact[Contacts.Fields.Addresses] = [{ street: profile.address, label: 'work' }];
      }

      const contactId = await Contacts.addContactAsync(nativeContact);
      if (contactId) {
        Alert.alert(t('common.success'), 'Saved directly to your phone contacts!');
      }
    } catch (error) {
      console.error("Native save failed", error);
      Alert.alert(t('common.error'), 'Failed to save contact');
    }
  };

  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    const config = SUPPORTED_SOCIALS[p] || SUPPORTED_SOCIALS['other'];

    return (
      <View style={[styles.socialIconBox, { backgroundColor: config.color + '15' }]}>
        <FontAwesome5 name={config.icon} size={16} color={config.color} />
      </View>
    );
  };

  const handleSavePress = async () => {
    if (isSaving || isAlreadySaved) return; 
    
    setIsSaving(true);
    try {
      await onSave(contact!); 
    } catch (error) {
      Alert.alert("Error", "Could not save connection.");
      setIsSaving(false); 
    }
  };

  const handleOpenURL = async (url: string) => {
    let supportedUrl = url.trim();
    if (!/^https?:\/\//i.test(supportedUrl)) {
      supportedUrl = `https://${supportedUrl}`;
    }
    try {
      await Linking.openURL(supportedUrl);
    } catch (e) {
      Alert.alert("Error", "Could not open link");
    }
  };

  return (
    <View style={styles.absoluteOverlay}>
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerText, { color: theme.primary }]}>{t('contactCard.title')}</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <X size={20} color={theme.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
          <View style={styles.profileSection}>
            {profile.profileImage ? (
              <Image 
                source={{ uri: profile.profileImage }} 
                style={[styles.profileAvatar, { borderColor: theme.primary, backgroundColor: theme.bg }]} 
              />
            ) : (
              <View style={[styles.initialsAvatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}

            <Text style={[styles.nameText, { color: theme.textMain }]}>{profile.firstName} {profile.lastName}</Text>
            {profile.title && <Text style={[styles.titleText, { color: theme.primary }]}>{profile.title}</Text>}
            {profile.company && <Text style={[styles.companyText, { color: theme.textSub }]}>{profile.company}</Text>}
          </View>

          <View style={styles.detailsGroup}>
            {(profile.phones?.length ? profile.phones : (profile.phone ? [profile.phone] : [])).map((num: string, idx: number) => (
              <View key={`tel-${idx}`} style={[styles.detailRow, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border }, idx > 0 && { marginTop: 8 }]}>
                <Phone size={18} color={theme.primary} />
                <Text style={[styles.detailValue, { color: theme.textMain }]}>{num}</Text>
              </View>
            ))}

            {(profile.emails?.length ? profile.emails : (profile.email ? [{address: profile.email}] : [])).map((em: any, idx: number) => (
              <View key={`mail-${idx}`} style={[styles.detailRow, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border, marginTop: 8 }]}>
                <Mail size={18} color={theme.primary} />
                <Text style={[styles.detailValue, { color: theme.textMain }]}>{em.address || em}</Text>
              </View>
            ))}

            {/* 🛑 Hiding the Location row if it's empty */}
            {profile.address && profile.address.trim() !== '' && (
              <View style={[styles.detailRow, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border, marginTop: 8 }]}>
                <MapPin size={18} color={theme.primary} />
                <Text style={[styles.detailValue, { color: theme.textMain }]}>{profile.address}</Text>
              </View>
            )}
          </View>

          {profile.links && profile.links.length > 0 && (
            <View style={styles.socialContainer}>
              {profile.links.map((link, idx) => {
                const config = SUPPORTED_SOCIALS[link.platform.toLowerCase()] || SUPPORTED_SOCIALS['other'];
                return (
                  <TouchableOpacity key={idx} style={[styles.socialBadge, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border }]} onPress={() => handleOpenURL(link.url)}>
                    {getSocialIcon(link.platform)}
                    <Text style={[styles.socialText, { color: config.color }]}>{link.platform}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.actionGroup}>
            <TouchableOpacity onPress={handleSaveToNativeContacts} style={[styles.exportButton, { borderColor: theme.primary }]}>
              <Download size={18} color={theme.primary} />
              <Text style={[styles.exportButtonText, { color: theme.primary }]}>{t('contactCard.saveToPhone')}</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onCancel} style={[styles.cancelButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                <Text style={[styles.cancelButtonText, { color: theme.textMain }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isAlreadySaved || isSaving }
                onPress={handleSavePress}
                style={[styles.saveButton, { backgroundColor: theme.primary }, (isAlreadySaved || isSaving) && styles.saveButtonDisabled]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" /> 
                ) : (
                  <>
                {isAlreadySaved ? <CheckCircle size={20} color="white" /> : <UserPlus size={20} color="white" />}
                <Text style={styles.saveButtonText}>
                  {isAlreadySaved ? t('common.saved') : t('contactCard.saveButton')}
                </Text>
              </>
            )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 99999, elevation: 99999 },
  card: { borderRadius: 32, width: '100%', maxWidth: 400, minHeight: 550, maxHeight: '90%', overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1 },
  headerText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  closeButton: { padding: 4 },
  scrollInner: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 2 },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  initialsAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  initialsText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  nameText: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  titleText: { fontSize: 13, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' },
  companyText: { fontSize: 14, marginTop: 2, fontWeight: '600' },
  detailsGroup: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  detailValue: { fontSize: 14, fontWeight: '500', flex: 1 },
  socialContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  socialIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  socialBadge: { flexDirection: 'row', alignItems: 'center', paddingRight: 12, paddingLeft: 4, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  socialText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  actionGroup: { gap: 12 },
  exportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, borderWidth: 2, marginBottom: 4 },
  exportButtonText: { fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontWeight: 'bold' },
  saveButton: { flex: 2, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveButtonDisabled: { backgroundColor: '#cbd5e1' },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
});