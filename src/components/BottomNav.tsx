import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Scan, Users, CreditCard, Settings, QrCode } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Global Theme Sync

interface BottomNavProps {
  activeTab: 'cards' | 'connections' | 'preview' | 'scan' | 'settings';
  onNavigate: (screen: string) => void;
  notificationCount: number;
}

export function BottomNav({ activeTab, onNavigate, notificationCount }: BottomNavProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // ✅ Hooked into Central Theme
  const { theme, isDark } = useTheme();

  const renderTab = (tabId: string, Icon: any, label: string) => {
    const isActive = activeTab === tabId;
    const activeColor = theme.primary;
    // Light mode inactive is slate-400, dark mode inactive is slate-500
    const inactiveColor = isDark ? '#64748b' : '#94a3b8';

    const getScreenName = (id: string) => {
      switch(id) {
        case 'cards': return 'identity-hub';
        case 'connections': return 'contacts-list';
        case 'preview': return 'qr-display';
        case 'scan': return 'qr-scanner';
        case 'settings': return 'settings';
        default: return 'identity-hub';
      }
    };

    return (
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => onNavigate(getScreenName(tabId))}
      >
        <View style={styles.iconContainer}>
          <Icon size={24} color={isActive ? activeColor : inactiveColor} />
          {tabId === 'connections' && notificationCount > 0 && <View style={[styles.navBadge, { borderColor: theme.cardBg }]} />}
        </View>
        <Text style={[styles.tabLabel, { color: isActive ? activeColor : inactiveColor }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.navContainer, { paddingBottom: insets.bottom, backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
      <View style={styles.tabBar}>
        {renderTab('cards', CreditCard, t('nav.cards', 'Card'))}
        {renderTab('connections', Users, t('nav.connections', 'Connections'))}
        {renderTab('preview', QrCode, t('nav.preview', 'Preview'))}
        {renderTab('scan', Scan, t('nav.scan', 'Scan'))}
        {renderTab('settings', Settings, t('nav.settings', 'Settings'))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: { borderTopWidth: 1, elevation: 10 },
  tabBar: { height: 65, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  iconContainer: { width: 24, height: 24, marginBottom: 4, position: 'relative' },
  tabLabel: { fontSize: 9, fontWeight: '700' },
  navBadge: { position: 'absolute', top: -2, right: -6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1.5 },
});