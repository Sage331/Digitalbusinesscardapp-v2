import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  StyleSheet, View, Text, TouchableOpacity, Image, 
  ScrollView, TextInput, Linking, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { 
  ArrowLeft, Phone, Mail, MapPin, Calendar, 
  Save, Trash2, ChevronRight, Download 
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Contact, SocialLink, UserProfile, SUPPORTED_SOCIALS } from '../types';
import { useUI } from '../contexts/UIContext';
import * as Contacts from 'expo-contacts';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Global Theme Sync

interface ContactDetailPageProps {
  contact: Contact;
  onBack: () => void;
  onUpdateNotes: (contactId: string, notes: string) => void;
  onDelete: (contactId: string) => void;
}

export function ContactDetailPage({ contact, onBack, onUpdateNotes, onDelete }: ContactDetailPageProps) {
  const { t } = useTranslation();
  const { showToast } = useUI();
  
  // ✅ Hooked into Central Theme
  const { theme, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'history'>('info');
  const [notes, setNotes] = useState(contact.notes || '');
  
  const profile = (contact.profile || {}) as UserProfile;
  const photo = profile.profileImage || profile.photo;
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();

  const handleSaveToContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('contactDetail.permissionRequired'));
        return;
      }

      const newContact: any = {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        company: profile.company || '',
        jobTitle: profile.title || '',
        phoneNumbers: profile.phones?.length 
          ? profile.phones.map(n => ({ number: n, label: 'mobile' }))
          : (profile.phone ? [{ number: profile.phone, label: 'mobile' }] : []),
        emails: profile.emails?.length
          ? profile.emails.map(e => ({ email: e.address || e, label: 'work' }))
          : (profile.email ? [{ email: profile.email, label: 'work' }] : []),
        urlAddresses: profile.website ? [{ url: profile.website, label: 'other' }] : [],
        note: `Met via ConnectMe on ${new Date(contact.dateMet).toLocaleDateString()}.`,
      };

      if (profile.address) {
        newContact.addresses = [{ street: profile.address, label: 'work' }];
      }

      const contactId = await Contacts.addContactAsync(newContact);
      if (contactId) {
        showToast(t('common.saved'), 'success');
      }
    } catch (error) {
      console.error("Save Contact Error:", error);
      showToast(t('common.error'), 'error');
    }
  };

  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    const config = SUPPORTED_SOCIALS[p] || SUPPORTED_SOCIALS['other'];
    return (
      <View style={[styles.socialIconBox, { backgroundColor: config.color + '15' }]}>
        <FontAwesome5 name={config.icon} size={18} color={config.color} />
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('common.today');
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const handleOpenURL = async (url: string) => {
    if (!url) return;
    let supportedUrl = url.trim().toLowerCase();
    if (!supportedUrl.startsWith('http://') && !supportedUrl.startsWith('https://')) {
      supportedUrl = `https://${supportedUrl}`;
    }
    try {
      await Linking.openURL(supportedUrl);
    } catch (error) {
      Alert.alert(t('common.error'), "Cannot open this link.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={theme.primary} />
          <Text style={[styles.backButtonText, { color: theme.primary }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.nameText, { color: theme.textMain }]} numberOfLines={1}>{profile.firstName} {profile.lastName}</Text>
            <Text style={[styles.titleText, { color: theme.primary }]} numberOfLines={1}>
              {profile.title} {profile.company && `@ ${profile.company}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs Nav */}
      <View style={[styles.tabNav, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        {['info', 'notes', 'history'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            style={[styles.tabButton, activeTab === tab && [styles.activeTabButton, { borderBottomColor: theme.primary }]]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textSub }]}>
              {t(`contactDetail.tabs.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.innerContent}>
          
          {activeTab === 'info' && (
            <View style={styles.tabPane}>
              <TouchableOpacity onPress={handleSaveToContacts} style={[styles.exportCard, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', borderColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
                <View style={[styles.exportIconBox, { backgroundColor: theme.primary }]}><Download size={20} color="white" /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.exportTitle, { color: theme.textMain }]}>{t('contactDetail.info.addToDevice')}</Text>
                  <Text style={[styles.exportSubtitle, { color: theme.primary }]}>SAVE DIRECTLY TO PHONE</Text>
                </View>
                <ChevronRight size={18} color={theme.primary} />
              </TouchableOpacity>

              {profile.bio && (
                <View style={[styles.bioCard, { backgroundColor: theme.primary }]}>
                  <Text style={styles.cardLabel}>{t('contactDetail.info.headline')}</Text>
                  <Text style={styles.bioText}>"{profile.bio}"</Text>
                </View>
              )}

              <View style={[styles.infoListCard, { backgroundColor: theme.cardBg }]}>
                {(profile.phones?.length ? profile.phones : (profile.phone ? [profile.phone] : [])).map((num, i) => (
                  <InfoRow 
                    key={`phone-${i}`}
                    icon={<Phone size={18} color={theme.textSub} />} 
                    label={t('common.phone')} 
                    value={num} 
                    theme={theme}
                    isDark={isDark}
                    onPress={() => Linking.openURL(`tel:${num}`)} 
                  />
                ))}

                {(profile.emails?.length ? profile.emails : (profile.email ? [{address: profile.email}] : [])).map((em, i) => (
                  <InfoRow 
                    key={`email-${i}`}
                    icon={<Mail size={18} color={theme.textSub} />} 
                    label={t('common.email')} 
                    value={em.address || em} 
                    theme={theme}
                    isDark={isDark}
                    onPress={() => Linking.openURL(`mailto:${em.address || em}`)} 
                  />
                ))}
                
                {/* 🛑 SUSPENDED: Address/Location row removed entirely for cleaner UI */}
              </View>

              {profile.metadata && Object.keys(profile.metadata).length > 0 && (
                <View style={[styles.metadataCard, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                  <Text style={[styles.cardLabelDark, { color: theme.textSub }]}>Additional Info</Text>
                  {Object.entries(profile.metadata).map(([key, val]) => (
                    <View key={key} style={styles.metadataRow}>
                      <Text style={[styles.metadataKey, { color: theme.textSub }]}>{key}:</Text>
                      <Text style={[styles.metadataVal, { color: theme.textMain }]}>{String(val)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {(profile.links || []).length > 0 && (
                <View style={[styles.socialCard, { backgroundColor: theme.cardBg }]}>
                  <Text style={[styles.cardLabelDark, { color: theme.textSub }]}>{t('contactDetail.info.socialWeb')}</Text>
                  {profile.links?.map((link: SocialLink, i: number) => {
                    const p = link.platform.toLowerCase();
                    const config = SUPPORTED_SOCIALS[p] || SUPPORTED_SOCIALS['other'];
                    
                    return (
                      <TouchableOpacity key={i} onPress={() => handleOpenURL(link.url)} style={[styles.socialLinkRow, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                        {getSocialIcon(link.platform)}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.socialPlatformText, { color: config.color }]}>
                            {link.platform}
                          </Text>
                          <Text style={[styles.socialUrlText, { color: theme.textMain }]} numberOfLines={1}>
                            {link.url.replace(/^https?:\/\//, '')}
                          </Text>
                        </View>
                        <ChevronRight size={16} color={theme.textSub} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {activeTab === 'notes' && (
            <View style={styles.tabPane}>
              <View style={[styles.notesCard, { backgroundColor: theme.cardBg }]}>
                <TextInput
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('contactDetail.notes.placeholder')}
                  placeholderTextColor={theme.textSub}
                  style={[styles.notesInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: theme.textMain }]}
                  textAlignVertical="top"
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity onPress={() => onUpdateNotes(contact.id, notes)} style={[styles.saveNotesButton, { backgroundColor: theme.primary }]}>
                    <Save size={18} color="white" />
                    <Text style={styles.saveNotesText}>{t('contactDetail.notes.saveButton')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'history' && (
            <View style={styles.tabPane}>
              <View style={[styles.historyCard, { backgroundColor: theme.cardBg }]}>
                <View style={styles.historyRow}>
                  <View style={[styles.historyIconBox, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}><Calendar size={20} color={theme.primary}/></View>
                  <View>
                    <Text style={[styles.historyLabel, { color: theme.textSub }]}>{t('contactDetail.history.firstMet')}</Text>
                    <Text style={[styles.historyValue, { color: theme.textMain }]}>{formatDate(contact.dateMet)}</Text>
                  </View>
                </View>
                {/* 🛑 SUSPENDED: Auto-location row removed entirely from History tab */}
              </View>
            </View>
          )}

          <TouchableOpacity onPress={() => onDelete(contact.id)} style={[styles.deleteButton, { backgroundColor: theme.cardBg, borderColor: isDark ? '#7f1d1d' : '#fee2e2' }]}>
            <Trash2 size={16} color="#f87171" />
            <Text style={styles.deleteButtonText}>{t('contactDetail.buttons.delete')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, onPress, theme, isDark }: any) {
  if (!value) return null;
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.infoRow}>
      <View style={[styles.infoIconBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: theme.textSub }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.textMain }]} numberOfLines={1}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 12, borderBottomWidth: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButtonText: { marginLeft: 8, fontWeight: 'bold' },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 16 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  nameText: { fontSize: 20, fontWeight: '900' },
  titleText: { fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  tabNav: { flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 1 },
  tabButton: { paddingVertical: 16, marginRight: 32, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabButton: { },
  tabText: { fontSize: 14, fontWeight: 'bold' },
  content: { flex: 1 },
  innerContent: { padding: 16, paddingBottom: 40 },
  tabPane: { width: '100%' },
  exportCard: { borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  exportIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  exportTitle: { fontSize: 14, fontWeight: '900' },
  exportSubtitle: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  bioCard: { borderRadius: 24, padding: 24, marginBottom: 16 },
  cardLabel: { fontSize: 10, fontWeight: '900', color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  cardLabelDark: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  bioText: { color: 'white', fontSize: 14, fontWeight: '500', fontStyle: 'italic' },
  infoListCard: { borderRadius: 24, padding: 20, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: 'bold' },
  socialCard: { borderRadius: 24, padding: 20, marginBottom: 16 },
  socialLinkRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 8 },
  socialIconBox: { width: 40, height: 40, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  socialPlatformText: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  socialUrlText: { fontSize: 13, fontWeight: 'bold' },
  metadataCard: { borderRadius: 24, padding: 20, marginBottom: 16 },
  metadataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metadataKey: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  metadataVal: { fontSize: 11, fontWeight: 'bold' },
  notesCard: { borderRadius: 24, padding: 20 },
  notesInput: { borderRadius: 16, height: 200, padding: 16, fontSize: 14 },
  notesActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  saveNotesButton: { flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  saveNotesText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  historyCard: { borderRadius: 24, padding: 24 },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  historyIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  historyLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  historyValue: { fontSize: 16, fontWeight: 'bold' },
  deleteButton: { width: '100%', height: 56, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  deleteButtonText: { color: '#f87171', fontWeight: 'bold' }
});