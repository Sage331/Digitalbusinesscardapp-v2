import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  useWindowDimensions, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; 

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const SLIDES = [
  {
    id: '1',
    image: require('../../assets/images/1(Onboarding Slide 1)_2.jpg'),
    titleKey: 'landing.slides.nfc.title',
    descKey: 'landing.slides.nfc.description',
  },
  {
    id: '2',
    image: require('../../assets/images/2(Onboarding Slide 2)_2.jpg'),
    titleKey: 'landing.slides.qr.title',
    descKey: 'landing.slides.qr.description',
  },
  {
    id: '3',
    image: require('../../assets/images/3(Onboarding Slide 3)_2.jpg'),
    titleKey: 'landing.slides.exchange.title',
    descKey: 'landing.slides.exchange.description',
  }
];

const ENABLE_LANGUAGE_POPUP = false;

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { signInWithGoogle } = useAuth();
  
  const { theme, isDark } = useTheme(); 

  const [showPopup, setShowPopup] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!ENABLE_LANGUAGE_POPUP) return; 
    
    const checkLanguageFixed = async () => {
      const isFixed = await AsyncStorage.getItem('connectme_lang_fixed');
      if (!isFixed) setShowPopup(true);
    };
    checkLanguageFixed();
  }, []);

  const handleLanguageFinalized = async () => {
    await AsyncStorage.setItem('connectme_lang_fixed', 'true');
    setShowPopup(false);
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert(t('common.error', 'Error'), t('errors.auth.googleFailed', 'Google Sign-In failed.'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentIndexRef.current + 1;
      if (nextIndex >= SLIDES.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
      currentIndexRef.current = viewableItems[0].index;
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      
      {/* 🛡️ VISUAL SHIELDING: Blocks interactions while auth is processing */}
      {authLoading && (
        <View style={[styles.loadingShield, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)' }]} />
      )}

      {ENABLE_LANGUAGE_POPUP && showPopup && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={styles.modalIcon}><Text style={{ fontSize: 32 }}>🌍</Text></View>
            <Text style={[styles.modalTitle, { color: theme.textMain }]}>{t('profile.edit.language.title', 'Select Language')}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSub }]}>{t('onboarding.steps.language.description', 'Choose your preferred language')}</Text>
            <LanguageSelector />
            <TouchableOpacity onPress={handleLanguageFinalized} style={[styles.modalButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalButtonText}>{t('onboarding.buttons.next', 'Continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={[styles.mainTitle, { color: theme.textMain }]}>
          Connect<Text style={{ color: theme.primary }}>Me</Text><Text style={{ color: '#eab308' }}>.</Text>
        </Text>
      </View>

      <View style={styles.carouselFlex}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />
              </View>
              <View style={styles.slideTextContent}>
                <Text style={[styles.slideTitle, { color: theme.textMain }]}>
                  {t(item.titleKey)}
                </Text>
                <Text style={[styles.slideDesc, { color: theme.textSub }]}>
                  {t(item.descKey)}
                </Text>
                
                <View style={styles.paginationContainer}>
                  {SLIDES.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        currentIndex === index ? [styles.dotActive, { backgroundColor: theme.primary }] : { backgroundColor: theme.border }
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
        />
      </View>

      <View style={styles.footerFlex}>
        <TouchableOpacity 
          style={[styles.authButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
          onPress={handleGoogleSignIn}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color={theme.textMain} />
          ) : (
            <>
              <Image 
                source={require('../../assets/images/google-logo.png')} 
                style={styles.googleLogoImage} 
              />
              <Text style={[styles.authButtonText, { color: theme.textMain }]}>
                {t('landing.buttons.google', 'Continue with Google')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.authButton, { backgroundColor: theme.cardBg, borderColor: theme.border }, authLoading && styles.disabledButton]} 
          onPress={onSignIn}
          disabled={authLoading}
        >
          <Mail size={20} color={theme.textSub} style={styles.btnIcon} />
          <Text style={[styles.authButtonText, { color: theme.textMain }]}>
            {t('landing.buttons.email', 'Continue with Email')}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerTextRow}>
          <Text style={[styles.footerTextLabel, { color: theme.textSub }]}>
            {t('landing.footer.newAccount', 'New to ConnectMe?')}
          </Text>
          <TouchableOpacity onPress={onGetStarted} disabled={authLoading}>
            <Text style={[styles.footerLinkText, { color: theme.primary }, authLoading && styles.disabledText]}>
              {t('landing.footer.createAccount', 'Create Account')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingShield: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  header: {
    flex: 0.10,
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    paddingTop: 4,
    backgroundColor: 'transparent' 
  },
  carouselFlex: {
    flex: 0.65, 
  },
  footerFlex: {
    flex: 0.25,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  
  mainTitle: {
    fontSize: 40, 
    fontWeight: '900', 
    letterSpacing: -1,
  },

  slide: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.15, 
    backgroundColor: 'transparent',
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  slideTextContent: {
    width: '100%',
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  slideDesc: {
    fontSize: 14, 
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12, 
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 6,
  },

  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: 12,
  },
  googleLogoImage: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  footerTextRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerTextLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  footerLinkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledText: {
    opacity: 0.6,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    marginTop: 24,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});