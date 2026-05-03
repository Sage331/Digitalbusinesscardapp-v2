import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  StyleSheet, View, Text, TouchableOpacity, 
  TextInput, ScrollView, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, Search, MapPin, Calendar, 
  ChevronRight, UserPlus 
} from 'lucide-react-native';
import { Contact, UserProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Global Theme Sync

interface ContactsListPageProps {
  contacts: Contact[];
  onContactSelect: (contact: Contact) => void;
  onBack: () => void;
}

export function ContactsListPage({ contacts, onContactSelect, onBack }: ContactsListPageProps) {
  const { t, i18n } = useTranslation();
  
  // ✅ Hooked into Central Theme
  const { theme, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    const profile = (contact.profile || {}) as UserProfile;
    
    return (
      (profile.firstName || '').toLowerCase().includes(query) ||
      (profile.lastName || '').toLowerCase().includes(query) ||
      (profile.username || '').toLowerCase().includes(query) || 
      (profile.company || '').toLowerCase().includes(query) ||
      (profile.title || '').toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return t('common.today', 'Today');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language || undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return dateString; }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      
      <View style={[styles.header, { backgroundColor: theme.cardBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={theme.primary} />
          <Text style={[styles.backButtonText, { color: theme.primary }]}>{t('contacts.backButton', 'Back')}</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.textMain }]}>{t('contacts.title', 'Contacts')}</Text>

        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
          <Search size={20} color={theme.textSub} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('contacts.search', 'Search contacts...')}
            placeholderTextColor={theme.textSub}
            style={[styles.searchInput, { color: theme.textMain }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredContacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
              <UserPlus size={40} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textMain }]}>{t('contacts.empty', 'No contacts yet')}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSub }]}>
              {t('contacts.emptyDescription', 'Start networking by scanning QR codes')}
            </Text>
          </View>
        ) : (
          filteredContacts.map((contact, index) => (
            <ContactListItem
              key={`${contact.id}-${index}`}
              contact={contact}
              onClick={() => onContactSelect(contact)}
              formatDate={formatDate}
              theme={theme}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactListItem({ contact, onClick, formatDate, theme }: { contact: Contact; onClick: () => void; formatDate: (d: string) => string; theme: any }) {
  const profile = (contact.profile || {}) as UserProfile;
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();

  return (
    <TouchableOpacity onPress={onClick} style={[styles.listItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.avatarContainer}>
        {profile.profileImage ? (
          <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText} numberOfLines={1} adjustsFontSizeToFit>
              {initials || '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: theme.textMain }]} numberOfLines={1} ellipsizeMode="tail">
          {profile.firstName} {profile.lastName}
        </Text>
        <Text style={[styles.itemSubtitle, { color: theme.primary }]} numberOfLines={1} ellipsizeMode="tail">
          {profile.title} {profile.company && `@ ${profile.company}`}
        </Text>

        <View style={styles.itemMetaRow}>
          <View style={styles.metaItem}>
            <Calendar size={12} color="#60a5fa" />
            <Text style={[styles.metaText, { color: theme.textSub }]} numberOfLines={1}>{formatDate(contact.dateMet)}</Text>
          </View>
          
          {/* 🛑 Location rendering removed completely for cleaner UI */}
        </View>
      </View>

      <ChevronRight size={20} color={theme.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButtonText: { fontWeight: 'bold', marginLeft: 8 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 16 },
  searchContainer: { position: 'relative', borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  searchIcon: { marginLeft: 16 },
  searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 14, fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 40 },
  listItem: { borderRadius: 32, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  avatarContainer: { marginRight: 16 },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center', paddingHorizontal: 2, width: '100%' },
  itemInfo: { flex: 1, flexShrink: 1, marginRight: 8 },
  itemName: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  itemSubtitle: { fontSize: 10, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase', flexShrink: 1 },
  itemMetaRow: { flexDirection: 'row', marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4 }
});