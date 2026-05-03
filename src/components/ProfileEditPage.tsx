import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  StyleSheet, View, Text, TouchableOpacity, Image, BackHandler,
  ScrollView, TextInput, ActivityIndicator, Alert, Modal, Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, Pencil, Image as ImageIcon, Plus, ChevronDown, X, ChevronRight, Trash2 
} from 'lucide-react-native'; 
import { FontAwesome5 } from '@expo/vector-icons';
import { UserProfile, SUPPORTED_SOCIALS } from '../types';
import * as ImagePicker from 'expo-image-picker';
// ✅ Import Theme Context
import { useTheme } from '../contexts/ThemeContext';

interface ProfileEditPageProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onBack: () => void;
  canDelete?: boolean; 
  onDelete?: () => void; 
}

type EmailType = "work" | "personal" | "other";
const emailTypes: EmailType[] = ['work', 'personal', 'other'];

type PlatformType = string;
const linkPlatforms = Object.keys(SUPPORTED_SOCIALS).filter(key => key !== 'other');
linkPlatforms.push('other');

export function ProfileEditPage({ profile, onSave, onBack, canDelete, onDelete }: ProfileEditPageProps) {
  const { t } = useTranslation();
  
  // ✅ Hook into Central Theme
  const { theme, isDark } = useTheme();
  
  // ✅ Dynamic backgrounds for inputs to maintain contrast
  const inputBg = isDark ? theme.cardBg : '#f3f4f6';

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [isCompressing, setIsCompressing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.profileImage || null);
  
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'email' | 'link'>('email');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const renderSocialIcon = (platform: string) => {
    const config = SUPPORTED_SOCIALS[platform.toLowerCase()] || SUPPORTED_SOCIALS['other'];
    return <FontAwesome5 name={config.icon} size={18} color={config.color} />;
  };

  const handleLinkChange = (index: number, url: string) => {
    const newLinks = [...(editedProfile.links || [])];
    newLinks[index].url = url;
    
    const lowercaseUrl = url.toLowerCase();
    const detected = Object.keys(SUPPORTED_SOCIALS).find(key => 
      key !== 'other' && lowercaseUrl.includes(key)
    );
    
    if (detected) {
      newLinks[index].platform = detected;
    }
    
    setEditedProfile({ ...editedProfile, links: newLinks });
  };

  const handlePhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(t('common.error'), 'Permission to access gallery is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotoPreview(base64Image);
      setEditedProfile({ ...editedProfile, profileImage: base64Image });
    }
  };

  const handleCancel = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleSave = async () => {
    onSave(editedProfile);
  };
  
  const openEmailPicker = (index: number) => {
    setPickerType('email');
    setActiveItemIndex(index);
    setPickerVisible(true);
  };

  const openPlatformPicker = (index: number) => {
    setPickerType('link');
    setActiveItemIndex(index);
    setPickerVisible(true);
  };

  const updateEmailType = (index: number, type: EmailType) => {
    const newEmails = [...(editedProfile.emails || [])];
    newEmails[index].type = type;
    setEditedProfile({ ...editedProfile, emails: newEmails });
  };

  const updatePlatform = (index: number, platform: PlatformType) => {
    const newLinks = [...(editedProfile.links || [])];
    newLinks[index].platform = platform;
    setEditedProfile({ ...editedProfile, links: newLinks });
  };

  useEffect(() => {
    const backAction = () => {
      handleCancel();
      return true; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove(); 
  }, [handleCancel]);

  const renderCustomPicker = () => {
    const isEmail = pickerType === 'email';
    const options = isEmail ? emailTypes : linkPlatforms;
    const title = isEmail ? 'Select Type' : 'Select Platform';

    return (
      <Modal transparent visible={pickerVisible} animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={[styles.customPickerCard, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={[styles.pickerTitle, { color: theme.textMain }]}>{title}</Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const config = !isEmail ? (SUPPORTED_SOCIALS[option] || SUPPORTED_SOCIALS['other']) : null;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pickerOption, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      if (isEmail && activeItemIndex !== null) updateEmailType(activeItemIndex, option as EmailType);
                      if (!isEmail && activeItemIndex !== null) updatePlatform(activeItemIndex, option);
                      setPickerVisible(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {!isEmail && <FontAwesome5 name={config?.icon} size={16} color={config?.color} />}
                      <Text style={[styles.pickerOptionText, !isEmail && { color: config?.color }]}>
                        {option.toUpperCase()}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={theme.textSub} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setPickerVisible(false)}>
              <Text style={[styles.pickerCancelText, { color: theme.textSub }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const initials = `${editedProfile.firstName?.[0] || ''}${editedProfile.lastName?.[0] || ''}`.toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* 🏛️ NEW STYLIZED HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={[styles.circleBackBtn, { backgroundColor: isDark ? theme.cardBg : '#9ca3af' }]}>
            <ChevronLeft size={24} color={isDark ? theme.textMain : "white"} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.textMain }]}>Edit Profile</Text>
          
          <TouchableOpacity style={[styles.circleEditBtn, { backgroundColor: inputBg }]} disabled>
            <Pencil size={20} color={theme.textMain} />
          </TouchableOpacity>
        </View>

        {/* 🏛️ SCROLLABLE FORM AREA */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
        >
          <View style={styles.formWidth}>
            
            {/* Avatar Area */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                {photoPreview ? (
                  <Image source={{ uri: photoPreview }} style={[styles.avatarImage, { borderColor: theme.bg }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { borderColor: theme.bg }]}>
                    <Text style={styles.avatarPlaceholderText}>{initials}</Text>
                  </View>
                )}
                <TouchableOpacity style={[styles.galleryBadge, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={handlePhotoUpload}>
                  <ImageIcon size={18} color={theme.textSub} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Core Flat Inputs (Label-less) */}
            <View style={styles.inputStack}>
              <TextInput 
                value={editedProfile.firstName || ""} 
                onChangeText={(text) => setEditedProfile({ ...editedProfile, firstName: text })}
                style={[styles.flatInput, { backgroundColor: inputBg, color: theme.textMain }]}
                placeholder="Enter your first name"
                placeholderTextColor={theme.textSub}
              />
              
              <TextInput 
                value={editedProfile.lastName || ""} 
                onChangeText={(text) => setEditedProfile({ ...editedProfile, lastName: text })}
                style={[styles.flatInput, { backgroundColor: inputBg, color: theme.textMain }]}
                placeholder="Enter your last name"
                placeholderTextColor={theme.textSub}
              />

              <TextInput 
                value={editedProfile.title || ""} 
                onChangeText={(text) => setEditedProfile({ ...editedProfile, title: text })}
                style={[styles.flatInput, { backgroundColor: inputBg, color: theme.textMain }]}
                placeholder="Enter your job title"
                placeholderTextColor={theme.textSub}
              />

              <TextInput 
                value={editedProfile.company || ""} 
                onChangeText={(text) => setEditedProfile({ ...editedProfile, company: text })}
                style={[styles.flatInput, { backgroundColor: inputBg, color: theme.textMain }]}
                placeholder="Enter your company name"
                placeholderTextColor={theme.textSub}
              />

              <TextInput 
                value={editedProfile.emails?.[0]?.address || ""} 
                onChangeText={(text) => {
                  const newEmails = [...(editedProfile.emails || [])];
                  if (newEmails.length === 0) newEmails.push({ type: 'work', address: '' });
                  newEmails[0].address = text;
                  setEditedProfile({ ...editedProfile, emails: newEmails });
                }}
                keyboardType="email-address"
                style={[styles.flatInput, { backgroundColor: inputBg, color: theme.textMain }]}
                placeholder="Enter your company email"
                placeholderTextColor={theme.textSub}
                autoCapitalize="none"
              />

              <TextInput 
                value={editedProfile.phone || ""} 
                onChangeText={(text) => setEditedProfile({ ...editedProfile, phone: text })}
                keyboardType="phone-pad"
                style={[styles.flatInput, { backgroundColor: inputBg, color: theme.textMain }]}
                placeholder="Enter your company phone number"
                placeholderTextColor={theme.textSub}
              />

              <TextInput 
                multiline
                maxLength={150}
                value={editedProfile.bio || ""} 
                onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                placeholder="Enter your company bio"
                placeholderTextColor={theme.textSub}
                style={[styles.flatInput, styles.textArea, { backgroundColor: inputBg, color: theme.textMain }]}
              />
            </View>

            {/* Flat Social Links */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textSub }]}>Social Handles</Text>
            </View>

            <View style={styles.socialStack}>
              {(editedProfile.links || []).map((link, index) => {
                const config = SUPPORTED_SOCIALS[link.platform.toLowerCase()] || SUPPORTED_SOCIALS['other'];
                return (
                  <View key={index} style={[styles.flatSocialRow, { backgroundColor: inputBg }]}>
                    <TouchableOpacity 
                      style={[styles.socialIconBtn, { borderRightColor: theme.border }]}
                      onPress={() => openPlatformPicker(index)}
                    >
                      {renderSocialIcon(link.platform)}
                      <ChevronDown size={12} color={theme.textSub} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>

                    <TextInput 
                      value={link.url || ""} 
                      onChangeText={(text) => handleLinkChange(index, text)}
                      autoCapitalize="none"
                      style={[styles.socialInput, { color: theme.textMain }]}
                      placeholder="Enter URL or Username"
                      placeholderTextColor={theme.textSub}
                    />
                    
                    <TouchableOpacity 
                      style={styles.socialDeleteBtn}
                      onPress={() => {
                        const newLinks = (editedProfile.links || []).filter((_, i) => i !== index);
                        setEditedProfile({ ...editedProfile, links: newLinks });
                      }}
                    >
                      <X size={18} color={theme.textSub} />
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity 
                style={[styles.addSocialBtn, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff', borderColor: isDark ? '#1e3a8a' : '#bfdbfe' }]}
                onPress={() => setEditedProfile({
                  ...editedProfile, 
                  links: [...(editedProfile.links || []), { platform: 'other', url: '' }]
                })}
              >
                <Plus size={16} color={theme.primary} />
                <Text style={[styles.addSocialText, { color: theme.primary }]}>Add Social Handle</Text>
              </TouchableOpacity>
            </View>

            {/* Delete Identity Feature */}
            {canDelete && onDelete && (
              <TouchableOpacity 
                style={[styles.deleteActionBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}
                onPress={() => {
                  Alert.alert(
                    'Delete Identity',
                    'Are you sure? This identity will be permanently removed.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: onDelete }
                    ]
                  );
                }}
              >
                <Trash2 size={18} color="#ef4444" />
                <Text style={styles.deleteActionText}>Delete this Identity</Text>
              </TouchableOpacity>
            )}

          </View>
        </ScrollView>

        {/* 🏛️ FIXED FOOTER - Outside ScrollView */}
        <View style={[styles.fixedFooter, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isCompressing}
            style={[styles.fullSaveBtn, { backgroundColor: theme.primary }, isCompressing && styles.disabledBtn]}
          >
            {isCompressing ? <ActivityIndicator color="white" /> : <Text style={styles.fullSaveBtnText}>Update Profile</Text>}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Custom Picker Overlay */}
      {renderCustomPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // New Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 4, 
    paddingBottom: 12 
  },
  circleBackBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  circleEditBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  formWidth: { maxWidth: 500, alignSelf: 'center', width: '100%' },
  
  // Avatar
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 4 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', borderWidth: 4 },
  avatarPlaceholderText: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  galleryBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  
  // Flat Inputs
  inputStack: { gap: 14, marginBottom: 24 },
  flatInput: { borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, fontSize: 15 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  
  // Social Handles
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  socialStack: { gap: 12, marginBottom: 24 },
  flatSocialRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingRight: 8 },
  socialIconBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRightWidth: 1 },
  socialInput: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 15 },
  socialDeleteBtn: { padding: 12 },
  addSocialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8, borderWidth: 1, borderStyle: 'dashed' },
  addSocialText: { fontWeight: 'bold', fontSize: 14 },
  
  // Delete Action
  deleteActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  deleteActionText: { color: '#ef4444', fontWeight: 'bold', fontSize: 15 },

  // 🏛️ Fixed Footer
  fixedFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 20, borderTopWidth: 1 },
  fullSaveBtn: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  fullSaveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  disabledBtn: { opacity: 0.7 },
  
  // Modal Overlays
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  customPickerCard: { borderRadius: 24, padding: 24 },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  pickerOptionText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  pickerCancelBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  pickerCancelText: { fontWeight: '600' }
});