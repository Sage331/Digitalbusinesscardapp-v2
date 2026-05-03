import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Modal,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Download, Share2, ChevronDown, Check } from 'lucide-react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy'; 
import * as MediaLibrary from 'expo-media-library';
import { UserProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Global Theme Sync

interface QRDisplayPageProps {
  fullProfile: UserProfile;
  activeIndex: number;
  onSwitchCard: (index: number) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function QRDisplayPage({ fullProfile, activeIndex, onSwitchCard }: QRDisplayPageProps) {
  const { t } = useTranslation();
  const qrRef = useRef<any>(null);
  
  // ✅ Hooked into Central Theme
  const { theme, isDark } = useTheme();
  
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const cardsArray = fullProfile.cards || [fullProfile];
  const activeCard = cardsArray[activeIndex] || cardsArray[0];

  const generateVCard = () => {
    const cleanBio = activeCard.bio ? activeCard.bio.replace(/\n/g, ' ').substring(0, 100) : '';
    
    const identifier = fullProfile.username || activeCard.id || fullProfile.id;
    const combinedNote = `ConnectMeID:${identifier}${cleanBio ? ' | ' + cleanBio : ''}`;

    const socialLinks = (activeCard.links || [])
      .map(link => `X-SOCIALPROFILE;TYPE=${link.platform}:${link.url}`)
      .join('\n');

    const emailSection = (activeCard.emails || [])
      .map(e => `EMAIL;TYPE=${e.type.toUpperCase()}:${e.address}`)
      .join('\n');

    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${activeCard.firstName} ${activeCard.lastName}`,
      `N:${activeCard.lastName};${activeCard.firstName};;;`,
      activeCard.company ? `ORG:${activeCard.company}` : '',
      activeCard.title ? `TITLE:${activeCard.title}` : '',
      activeCard.phone ? `TEL;TYPE=CELL:${activeCard.phone}` : '',
      emailSection || (activeCard.email ? `EMAIL;TYPE=WORK:${activeCard.email}` : ''),
      socialLinks, 
      `NOTE:${combinedNote}`,
      'END:VCARD'
    ].filter(line => !!line).join('\n');
  };

  const vCardData = generateVCard();

  const handleShare = () => {
    if (!qrRef.current) return;
    requestAnimationFrame(() => {
      qrRef.current.toDataURL(async (dataURL: string) => {
        try {
          const FS: any = FileSystem; 
          const fileUri = `${FS.cacheDirectory}connectme-qr.png`;
          const cleanData = dataURL.replace(/^data:image\/png;base64,/, "");
          await FS.writeAsStringAsync(fileUri, cleanData, { encoding: 'base64' });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'image/png',
              dialogTitle: t('qr.share.title', 'Share your QR Code'),
            });
          }
        } catch (error) {
          Alert.alert(t('common.error', 'Error'), t('qr.share.failed', 'Failed to share QR Code.'));
        }
      });
    });
  };

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(t('common.error', 'Permission Denied'), t('qr.save.permission', 'I need permission to save the QR code.'));
        return;
      }
      if (!qrRef.current) return;

      requestAnimationFrame(() => {
        qrRef.current.toDataURL(async (dataURL: string) => {
          try {
            const FS: any = FileSystem;
            const fileUri = `${FS.cacheDirectory}qr_save.png`;
            const cleanData = dataURL.replace(/^data:image\/png;base64,/, "");
            await FS.writeAsStringAsync(fileUri, cleanData, { encoding: 'base64' });
            await MediaLibrary.saveToLibraryAsync(fileUri);
            Alert.alert(t('common.success', 'Success'), t('common.savedToGallery', 'Saved to Gallery!'));
          } catch (e) { console.error(e); }
        });
      });
    } catch (error) {
      Alert.alert("Notice", "Gallery save is restricted in Expo Go. Use the 'Share' button instead.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      
      <View style={styles.header}>
        <Text style={styles.logoText}>
          <Text style={{ color: theme.textMain }}>Connect</Text>
          <Text style={{ color: theme.primary }}>Me.</Text>
        </Text>
        <TouchableOpacity style={styles.switcherBtn} onPress={() => setSwitcherVisible(true)}>
          <Text style={[styles.switcherName, { color: theme.textMain }]} numberOfLines={1}>
            {activeCard.firstName} {activeCard.lastName}
          </Text>
          <ChevronDown size={18} color={theme.textMain} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        
        <View style={styles.qrSection}>
          <Text style={[styles.scanTitle, { color: theme.textMain }]}>Scan to Share Card</Text>
          <View style={styles.qrWrapper} collapsable={false}>
            <View style={{ transform: [{ scale: SCREEN_HEIGHT < 700 ? 0.22 : 0.25 }] }}> 
              <QRCodeSVG
                value={vCardData}
                size={1024} 
                color="#000000" 
                backgroundColor="#FFFFFF" 
                quietZone={40} 
                ecl="M" 
                getRef={(c) => (qrRef.current = c)} 
              />
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity onPress={handleDownload} style={[styles.grayBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.grayBtnText, { color: theme.textMain }]}>Save QR Code</Text>
            <Download size={20} color={theme.textMain} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={[styles.grayBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.grayBtnText, { color: theme.textMain }]}>Share QR Code</Text>
            <Share2 size={20} color={theme.textMain} />
          </TouchableOpacity>
        </View>

      </View>

      <Modal visible={switcherVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlayWhite, { backgroundColor: theme.bg }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textMain }]}>Select Card</Text>
            </View>

            <View style={styles.modalList}>
              {cardsArray.map((card: any, idx: number) => {
                const isSelected = idx === activeIndex;
                const initials = `${card.firstName?.[0] || ''}${card.lastName?.[0] || ''}`.toUpperCase();
                const displayEmail = card.emails?.[0]?.address || 'No email provided';

                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.cardItem, 
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      isSelected && { borderColor: theme.primary, backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }
                    ]}
                    onPress={() => { onSwitchCard(idx); setSwitcherVisible(false); }}
                  >
                    <View style={styles.cardItemLeft}>
                      {card.profileImage ? (
                        <Image source={{ uri: card.profileImage }} style={styles.cardAvatar} />
                      ) : (
                        <View style={[styles.cardAvatarPlaceholder, { backgroundColor: theme.primary }]}>
                          <Text style={styles.cardAvatarText}>{initials}</Text>
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardItemName, { color: theme.textMain }]}>{card.firstName} {card.lastName}</Text>
                        <Text style={[styles.cardItemSub, { color: theme.textSub }]} numberOfLines={1}>{displayEmail}</Text>
                      </View>
                    </View>
                    
                    {isSelected ? (
                      <View style={[styles.radioActive, { backgroundColor: theme.primary }]}>
                        <Check size={14} color="white" />
                      </View>
                    ) : (
                      <View style={[styles.radioInactive, { borderColor: theme.border }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.primary }]} onPress={() => setSwitcherVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
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
    paddingTop: 4, 
    paddingBottom: 16,
    backgroundColor: 'transparent'
  },
  logoText: { fontSize: 25, fontWeight: '900', letterSpacing: -0.5 },
  switcherBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '50%' },
  switcherName: { fontSize: 16, fontWeight: '700' },
  contentArea: { flex: 1, justifyContent: 'space-evenly', paddingHorizontal: 24, paddingBottom: 100 },
  qrSection: { alignItems: 'center', width: '100%' },
  scanTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  qrWrapper: { 
    width: 260, 
    height: 260, 
    justifyContent: 'center', 
    alignItems: 'center', 
    alignSelf: 'center', 
    backgroundColor: '#ffffff' 
  },
  actionSection: { width: '100%', gap: 12 },
  grayBtn: { 
    width: '100%', 
    paddingVertical: 18, 
    paddingHorizontal: 20, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
  },
  grayBtnText: { fontWeight: 'bold', fontSize: 16 },
  modalOverlayWhite: { flex: 1 },
  modalHeader: { paddingTop: 20, paddingBottom: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalList: { paddingHorizontal: 16, gap: 12 },
  cardItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1.5, 
  },
  cardItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardAvatar: { width: 48, height: 48, borderRadius: 24 },
  cardAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  cardAvatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cardInfo: { marginLeft: 16, flex: 1 },
  cardItemName: { fontSize: 16, fontWeight: 'bold' },
  cardItemSub: { fontSize: 13, marginTop: 2 },
  radioActive: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  radioInactive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  modalFooter: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 20, left: 16, right: 16 },
  cancelBtn: { paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});