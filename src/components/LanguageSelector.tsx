import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // ✅ Global Theme Sync

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
];

export function LanguageSelector() {
  const { language, setLanguage } = useAuth();
  
  // ✅ Hooked into Central Theme
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {languages.map((lang) => {
        const isActive = language === lang.code;
        
        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => setLanguage(lang.code)}
            activeOpacity={0.7}
            style={[
              styles.langButton,
              {
                // Dynamic Background and Border based on Theme
                backgroundColor: isActive 
                  ? (isDark ? '#1e3a8a' : '#eff6ff') 
                  : theme.cardBg,
                borderColor: isActive ? theme.primary : theme.border
              }
            ]}
          >
            <Text style={styles.flagText}>{lang.flag}</Text>
            <Text style={[
              styles.langName,
              // Dynamic Text Color
              { color: isActive ? theme.primary : theme.textSub }
            ]}>
              {lang.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%', 
  },
  flagText: {
    fontSize: 18,
    marginRight: 8,
  },
  langName: {
    fontSize: 14,
    fontWeight: '600',
  }
});