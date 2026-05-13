import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, Image, 
  ScrollView, Modal, Dimensions, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, UserRoundPen, Share2, MoreHorizontal, 
  X, Copy, UserPlus
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { UserProfile, SUPPORTED_SOCIALS } from '../types';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Global Theme Sync

interface IdentityHubProps {
  profile: UserProfile;
  onEditCard: (index: number) => void;
  onPreviewCard: (index: number) => void;
  onAddCard: (mode: 'fresh' | 'duplicate', sourceIndex?: number) => void;
  onScanQR: () => void;
  onViewContacts: () => void;
  onOpenSettings: () => void;
  notificationCount: number;
  onDeleteCard?: (index: number) => void; 
}

const { width } = Dimensions.get('window');

export function IdentityHub({
  profile,
  onEditCard,
  onPreviewCard,
  onAddCard,
  onScanQR,
  onViewContacts,
  onOpenSettings,
  notificationCount,
  onDeleteCard
}: IdentityHubProps) {
  const { t } = useTranslation();
  
  // ✅ Hooked into Central Theme
  const { theme, isDark } = useTheme();

  // Modals state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  
  // Target data state
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [activeOptionsCard, setActiveOptionsCard] = useState<any>(null);
  const [activeOptionsIndex, setActiveOptionsIndex] = useState<number>(0);
  
  const cardsArray = profile.cards || [profile];

  const handlePreviewPress = (card: any) => {
    setSelectedCard(card);
    setShareModalVisible(true);
  };

  const handleOpenOptions = (card: any, index: number) => {
    setActiveOptionsCard(card);
    setActiveOptionsIndex(index);
    setOptionsModalVisible(true);
  };

  const handleDeletePress = () => {
    setOptionsModalVisible(false);
    
    if (cardsArray.length <= 1) {
      Alert.alert(
        t('common.error', 'Error'), 
        t('hub.cannotDeleteLast', 'You cannot delete your only identity.')
      );
      return;
    }

    Alert.alert(
      t('hub.deleteTitle', 'Delete Identity'),
      t('hub.deleteConfirm', 'Are you sure? This identity will be permanently removed.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('common.delete', 'Delete'), 
          style: 'destructive', 
          onPress: () => onDeleteCard && onDeleteCard(activeOptionsIndex) 
        }
      ]
    );
  };

  const renderSocialIcon = (platform: string, size = 16) => {
    const config = SUPPORTED_SOCIALS[platform.toLowerCase()] || SUPPORTED_SOCIALS['other'];
    return <FontAwesome5 name={config.icon} size={size} color={config.color} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
        
      <View style={styles.header}>
        <Text style={styles.logoText}>
          <Text style={{ color: theme.textMain }}>Connect</Text>
          <Text style={{ color: theme.primary }}>Me.</Text>
        </Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.headerAddBtn}>
          <UserPlus size={24} color={theme.textMain} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cardsArray.map((card, index) => {
          const initials = `${card.firstName?.[0] || ''}${card.lastName?.[0] || ''}`.toUpperCase();
          const displayEmail = card.emails?.[0]?.address || 'No email provided';
          
          return (
            <View key={index} style={[styles.identityBlock, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.bannerContainer, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                <View style={styles.defaultBanner} />
              </View>

              <View style={[styles.avatarContainer, { borderColor: theme.cardBg, backgroundColor: theme.cardBg }]}>
                {card.profileImage ? (
                  <Image source={{ uri: card.profileImage }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>{initials}</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoContainer}>
                <Text style={[styles.cardName, { color: theme.textMain }]} numberOfLines={1}>
                  {card.firstName} {card.lastName}
                </Text>
                <Text style={[styles.cardEmail, { color: theme.textSub, marginBottom: 20 }]} numberOfLines={1}>
                  {displayEmail}
                </Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]} onPress={() => onEditCard(index)}>
                  <UserRoundPen size={16} color={theme.textMain} />
                  <Text style={[styles.actionBtnText, { color: theme.textMain }]}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]} onPress={() => onPreviewCard(index)}>
                  <Share2 size={16} color={theme.textMain} />
                  <Text style={[styles.actionBtnText, { color: theme.textMain }]}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.moreBtn, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]} onPress={() => handleOpenOptions(card, index)}>
                  <MoreHorizontal size={20} color={theme.textMain} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {cardsArray.length < 5 && (
            <TouchableOpacity style={[styles.createMainBtn, { backgroundColor: theme.primary }]} onPress={() => setAddModalVisible(true)}>
                <Text style={styles.createMainBtnText}>Create New Card</Text>
            </TouchableOpacity>
        )}
      </ScrollView>

      {/* ⚙️ iOS-STYLE OPTIONS ACTION SHEET */}
      <Modal visible={optionsModalVisible} transparent animationType="slide" onRequestClose={() => setOptionsModalVisible(false)}>
        <TouchableOpacity 
          style={styles.optionsOverlay} 
          activeOpacity={1} 
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={styles.optionsContainer}>
            
            <View style={[styles.optionsMainBlock, { backgroundColor: theme.cardBg }]}>
              <View style={[styles.optionsHeader, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <Text style={[styles.optionsHeaderText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {activeOptionsCard?.firstName} {activeOptionsCard?.lastName}
                </Text>
              </View>

              <TouchableOpacity style={[styles.optionsBtn, { backgroundColor: theme.cardBg }]} onPress={() => { setOptionsModalVisible(false); onAddCard('duplicate', activeOptionsIndex); }}>
                <Text style={[styles.optionsBtnTextBlue, { color: theme.primary }]}>Duplicate Card</Text>
              </TouchableOpacity>
              <View style={[styles.optionsDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity style={[styles.optionsBtn, { backgroundColor: theme.cardBg }]} onPress={handleDeletePress}>
                <Text style={styles.optionsBtnTextRed}>Delete Card</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.optionsCancelBlock, { backgroundColor: theme.cardBg }]} onPress={() => setOptionsModalVisible(false)}>
              <Text style={[styles.optionsCancelText, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

      {/* ➕ ADD IDENTITY CHOICE MODAL */}
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalOverlayChoice}>
          <View style={[styles.choiceCard, { backgroundColor: theme.cardBg }]}>
            <View style={styles.choiceHeader}>
              <Text style={[styles.choiceTitle, { color: theme.textMain }]}>New Identity</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={24} color={theme.textSub} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.choiceBtn, { borderColor: theme.border }]} 
              onPress={() => { setAddModalVisible(false); onAddCard('fresh'); }}
            >
              <View style={[styles.choiceIconBox, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
                <UserPlus size={24} color={theme.primary} />
              </View>
              <View style={styles.choiceTextContainer}>
                <Text style={[styles.choiceBtnTitle, { color: theme.textMain }]}>Start Fresh</Text>
                <Text style={[styles.choiceBtnDesc, { color: theme.textSub }]}>Create a blank profile from scratch.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.choiceBtn, { borderColor: theme.border }]} 
              onPress={() => { setAddModalVisible(false); onAddCard('duplicate', 0); }}
            >
              <View style={[styles.choiceIconBox, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                <Copy size={24} color={theme.textSub} />
              </View>
              <View style={styles.choiceTextContainer}>
                <Text style={[styles.choiceBtnTitle, { color: theme.textMain }]}>Duplicate Main Card</Text>
                <Text style={[styles.choiceBtnDesc, { color: theme.textSub }]}>Copy your photo and links to save time.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🎴 SHARE / PREVIEW MODAL */}
      <Modal visible={shareModalVisible} transparent animationType="fade" onRequestClose={() => setShareModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.shareCard, { backgroundColor: theme.cardBg }]}>
            <TouchableOpacity style={styles.closeModal} onPress={() => setShareModalVisible(false)}>
              <X size={24} color={theme.textSub} />
            </TouchableOpacity>
            <View style={styles.cardHeader}>
                <Text style={[styles.cardLogo, { color: theme.primary }]}>ConnectMe</Text>
                <Text style={[styles.cardTagline, { color: theme.textSub }]}>connect with me...</Text>
            </View>
            <View style={[styles.qrWrapper, { backgroundColor: isDark ? 'white' : 'white' }]}>
                <QRCode 
                    value={JSON.stringify({ id: selectedCard?.cardId || profile.id, type: 'connectme' })}
                    size={width * 0.5}
                    color="#000000"
                    backgroundColor="white"
                />
            </View>
            <View style={styles.cardFooter}>
                <Text style={[styles.footerName, { color: theme.textMain }]}>{selectedCard?.firstName} {selectedCard?.lastName}</Text>
                <View style={styles.footerSocials}>
                    {(selectedCard?.links || []).map((link: any, i: number) => (
                        <View key={i} style={[styles.footerIcon, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>{renderSocialIcon(link.platform, 18)}</View>
                    ))}
                </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingTop: 4,
    backgroundColor: 'transparent'
  },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }, 
  headerAddBtn: { padding: 4 },
  
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 }, 
  
  identityBlock: { 
    borderRadius: 12, 
    marginBottom: 20, 
    borderWidth: 1, 
    overflow: 'hidden'
  },
  bannerContainer: { height: 100, width: '100%' },
  defaultBanner: { flex: 1 }, 
  
  avatarContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 4, 
    alignSelf: 'center', 
    marginTop: -50, 
    overflow: 'hidden'
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#65a30d', justifyContent: 'center', alignItems: 'center' }, 
  avatarPlaceholderText: { color: 'white', fontWeight: 'bold', fontSize: 36 },
  
  infoContainer: { alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  cardName: { fontSize: 20, fontWeight: '800' },
  cardEmail: { fontSize: 13, marginTop: 6 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  actionBtnText: { fontWeight: '700', fontSize: 14 },
  moreBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  createMainBtn: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  createMainBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  optionsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  optionsContainer: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  optionsMainBlock: { borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  optionsHeader: { paddingVertical: 14, alignItems: 'center' },
  optionsHeaderText: { fontSize: 13, fontWeight: '500' },
  optionsBtn: { paddingVertical: 16, alignItems: 'center' },
  optionsDivider: { height: 1 },
  optionsBtnTextBlue: { fontSize: 18, fontWeight: '400' },
  optionsBtnTextRed: { fontSize: 18, color: '#ef4444', fontWeight: '400' },
  optionsCancelBlock: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  optionsCancelText: { fontSize: 18, fontWeight: 'bold' },

  modalOverlayChoice: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  choiceCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  choiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  choiceTitle: { fontSize: 20, fontWeight: 'bold' },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  choiceIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  choiceTextContainer: { marginLeft: 16, flex: 1 },
  choiceBtnTitle: { fontSize: 16, fontWeight: 'bold' },
  choiceBtnDesc: { fontSize: 12, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center' },
  shareCard: { width: '85%', borderRadius: 32, padding: 32, alignItems: 'center' },
  closeModal: { alignSelf: 'flex-end' },
  cardHeader: { alignItems: 'center', marginBottom: 20 },
  cardLogo: { fontSize: 24, fontWeight: 'bold' },
  cardTagline: { fontSize: 12, marginTop: 4 },
  qrWrapper: { padding: 15, borderRadius: 20, elevation: 4, shadowOpacity: 0.1, marginBottom: 20 },
  cardFooter: { alignItems: 'center' },
  footerName: { fontSize: 20, fontWeight: '900', marginBottom: 12 },
  footerSocials: { flexDirection: 'row', gap: 10 },
  footerIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }
});