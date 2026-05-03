import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Share,
  Modal,
  Platform
} from 'react-native';
// ✅ Edges updated to ['top', 'bottom'] in the Modal to fix the overlap!
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  LogOut, 
  ChevronRight,
  Share as ShareIcon,
  HelpCircle,
  FileText,
  ShieldCheck,
  AtSign,
  Moon,
  Sun,
  MonitorSmartphone // ✅ Added to represent 'System' theme
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsPageProps {
  user: any;
  onBack: () => void;
  onUpdatePassword?: (currentPass: string, newPass: string) => Promise<void>; 
  onUpdateProfile: (profile: any) => void; 
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export function SettingsPage({ 
  user, 
  onBack, 
  onUpdateProfile, 
  onLogout, 
  onDeleteAccount 
}: SettingsPageProps) {
  
  // ✅ Hooked into Central Theme
  const { theme, isDark, themeMode, setThemeMode } = useTheme();

  const [isAccountInfoVisible, setAccountInfoVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');

  const handleSaveChanges = () => {
    setLoading(true);
    setTimeout(() => {
      onUpdateProfile({ ...user, firstName, lastName });
      setLoading(false);
      Alert.alert('Success', 'Account info updated successfully!');
      setAccountInfoVisible(false);
    }, 800);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out ConnectMe! The best way to share your digital identity.',
      });
    } catch (error) {
      console.log('Error sharing app', error);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action is permanent and will delete all your cards and contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDeleteAccount }
      ]
    );
  };

  const comingSoon = () => Alert.alert('Coming Soon', 'This feature is currently under development.');

  // ✅ Cycle through System -> Light -> Dark
  const handleCycleTheme = () => {
    if (themeMode === 'system') setThemeMode('light');
    else if (themeMode === 'light') setThemeMode('dark');
    else setThemeMode('system');
  };

  const getThemeIcon = () => {
    if (themeMode === 'system') return <MonitorSmartphone size={20} color={theme.textSub} />;
    if (themeMode === 'dark') return <Moon size={20} color={theme.textSub} />;
    return <Sun size={20} color={theme.textSub} />;
  };

  const getThemeText = () => {
    if (themeMode === 'system') return "System Default";
    if (themeMode === 'dark') return "Dark Mode";
    return "Light Mode";
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      
      <View style={styles.mainHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.textMain} />
        </TouchableOpacity>
        <Text style={[styles.mainTitle, { color: theme.textMain }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity style={[styles.profileCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => setAccountInfoVisible(true)}>
          <View style={styles.profileCardLeft}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{initials || 'U'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.textMain }]}>{user.firstName} {user.lastName}</Text>
              
              <View style={styles.usernameBadge}>
                <AtSign size={12} color={theme.primary} />
                <Text style={[styles.usernameBadgeText, { color: theme.primary }]}>{user.username}</Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color={theme.textSub} />
        </TouchableOpacity>

        {/* Menu List */}
        <View style={[styles.menuContainer, { backgroundColor: theme.cardBg }]}>
          
          {/* ✅ THE 3-WAY THEME TOGGLE */}
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={handleCycleTheme}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border }]}>
                {getThemeIcon()}
              </View>
              <Text style={[styles.menuItemText, { color: theme.textMain }]}>Theme</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: theme.textSub, marginRight: 8, fontWeight: '600' }}>{getThemeText()}</Text>
              <ChevronRight size={18} color={theme.border} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={handleShareApp}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border }]}>
                <ShareIcon size={20} color={theme.textSub} />
              </View>
              <Text style={[styles.menuItemText, { color: theme.textMain }]}>Share App</Text>
            </View>
            <ChevronRight size={18} color={theme.border} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={comingSoon}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border }]}>
                <HelpCircle size={20} color={theme.textSub} />
              </View>
              <Text style={[styles.menuItemText, { color: theme.textMain }]}>Help & Support</Text>
            </View>
            <ChevronRight size={18} color={theme.border} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={comingSoon}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border }]}>
                <FileText size={20} color={theme.textSub} />
              </View>
              <Text style={[styles.menuItemText, { color: theme.textMain }]}>Terms & Conditions</Text>
            </View>
            <ChevronRight size={18} color={theme.border} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={comingSoon}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border }]}>
                <ShieldCheck size={20} color={theme.textSub} />
              </View>
              <Text style={[styles.menuItemText, { color: theme.textMain }]}>Privacy Policy</Text>
            </View>
            <ChevronRight size={18} color={theme.border} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={onLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border }]}>
                <LogOut size={20} color={theme.textSub} />
              </View>
              <Text style={[styles.menuItemText, { color: theme.textMain }]}>Log Out</Text>
            </View>
            <ChevronRight size={18} color={theme.border} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>v1.0</Text>
      </ScrollView>

      {/* ⚙️ ACCOUNT INFO MODAL */}
      <Modal visible={isAccountInfoVisible} animationType="slide">
        {/* ✅ FIXED: Added 'top' to edges so it clears the status bar */}
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
          
          <View style={[styles.modalHeader, { backgroundColor: theme.bg }]}>
            <TouchableOpacity onPress={() => setAccountInfoVisible(false)} style={styles.modalBack}>
              <ArrowLeft size={24} color={theme.textMain} />
            </TouchableOpacity>
            <Text style={[styles.modalTitleText, { color: theme.textMain }]}>Account Info</Text>
            <View style={{ width: 24 }} /> 
          </View>

          <View style={styles.modalContent}>
            <View style={styles.topSection}>
              <View style={styles.inputGroup}>

                <View style={[styles.horizontalInputRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSub }]}>First Name</Text>
                  <TextInput 
                    style={[styles.horizontalInput, { color: theme.textMain }]} 
                    value={firstName} 
                    onChangeText={setFirstName} 
                    textAlign="right" 
                  />
                </View>

                <View style={[styles.horizontalInputRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSub }]}>Last Name</Text>
                  <TextInput 
                    style={[styles.horizontalInput, { color: theme.textMain }]} 
                    value={lastName} 
                    onChangeText={setLastName} 
                    textAlign="right" 
                  />
                </View>

                <View style={[styles.horizontalInputRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSub }]}>Username</Text>
                  <Text style={[styles.lockedText, { color: theme.textSub }]}>@{user.username}</Text>
                </View>

                <View style={[styles.horizontalInputRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSub }]}>Email</Text>
                  <Text style={[styles.lockedText, { color: theme.textSub }]}>{user.email}</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSaveChanges}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: theme.cardBg, borderColor: isDark ? '#7f1d1d' : '#fee2e2' }]} onPress={confirmDelete}>
                <Text style={styles.deleteBtnText}>Delete Account</Text>
              </TouchableOpacity>

              <Text style={styles.supportText}>
                Need to change your username or email?{'\n'}Contact <Text style={[styles.supportEmail, { color: theme.primary }]}>support@connectme.com</Text>
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainHeader: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 10 },
  mainTitle: { fontSize: 24, fontWeight: '900', marginTop: 10 },
  backButton: { marginBottom: 10, alignSelf: 'flex-start' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 20, marginBottom: 30, borderWidth: 1 },
  profileCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  profileInfo: { marginLeft: 16, flex: 1, paddingRight: 10 },
  profileName: { fontSize: 18, fontWeight: 'bold' },
  usernameBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  usernameBadgeText: { fontWeight: '700', fontSize: 13 },
  menuContainer: { borderRadius: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, paddingHorizontal: 16 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  menuItemText: { fontSize: 16, fontWeight: '600' },
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: '600', marginTop: 40, marginBottom: 20 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingTop: 8 },
  modalBack: { padding: 4 },
  modalTitleText: { fontSize: 20, fontWeight: 'bold' },
  modalContent: { flex: 1, justifyContent: 'space-between', padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  topSection: { width: '100%' },
  inputGroup: { gap: 12, marginBottom: 24 },
  horizontalInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  inputLabel: { fontSize: 14, fontWeight: '600' },
  horizontalInput: { flex: 1, fontSize: 15, fontWeight: '700' },
  lockedText: { fontWeight: '600', fontSize: 15 }, 
  saveBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  bottomSection: { width: '100%', alignItems: 'center' },
  deleteBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, marginBottom: 20 },
  deleteBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  supportText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, lineHeight: 18 },
  supportEmail: { fontWeight: 'bold' }
});