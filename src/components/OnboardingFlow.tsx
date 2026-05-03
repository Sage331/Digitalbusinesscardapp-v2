import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Modal,
  Image,
  BackHandler,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X as CloseIcon, Info } from 'lucide-react-native';
import { AntDesign, FontAwesome6 } from '@expo/vector-icons';
import { UserProfile } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext'; 

const getFriendlyErrorMessage = (errorCode: string, t: any) => {
  switch (errorCode) {
    case 'auth/email-already-in-use': return t('errors.auth.emailInUse', 'This email is already registered. Try logging in.');
    case 'auth/invalid-email': return t('errors.auth.invalidEmail', 'Please enter a valid email address.');
    case 'auth/weak-password': return t('errors.auth.weakPassword', 'Password must be at least 8 characters long.');
    case 'auth/network-request-failed': return t('errors.auth.networkError', 'Network error. Please check your connection.');
    default: return t('errors.auth.generic', 'Sign up failed. Please try again.');
  }
};

export function OnboardingFlow({ 
  onComplete, 
  onSignOut, 
  onSignIn 
}: { 
  onComplete: (profile: UserProfile, password?: string) => Promise<void> | void, 
  onSignOut: () => void,
  onSignIn: () => void 
}) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const { theme, isDark } = useTheme();
  const inputBg = isDark ? theme.cardBg : '#f4f4f5';

  const { signInWithGoogle, userProfile } = useAuth();
  
  const isGoogleUser = !!userProfile;

  // ✅ ALWAYS start at step 0 so Google users can visually confirm their pre-filled name
  const [currentStep, setCurrentStep] = useState(0);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); 
  
  const [profile, setProfile] = useState<Partial<UserProfile>>({ 
    language: i18n.language as any,
    links: [],
    emails: []
  });

  const [socialInputs, setSocialInputs] = useState({
    x: '',
    linkedin: '',
    instagram: '',
    facebook: ''
  });

  useEffect(() => {
    if (isGoogleUser && userProfile) {
      setProfile(prev => ({
        ...prev,
        firstName: userProfile.firstName || prev.firstName,
        lastName: userProfile.lastName || prev.lastName,
        email: userProfile.email || prev.email
      }));
    }
  }, [isGoogleUser, userProfile]);

  useEffect(() => {
    const loadLang = async () => {
      const saved = await AsyncStorage.getItem('connectme_lang');
      if (saved) setProfile(prev => ({ ...prev, language: saved as any }));
    };
    loadLang();
  }, []);

  const steps = [
    { key: 'personal', title: t('onboarding.steps.personal.title', 'What should we call you?'), description: t('onboarding.steps.personal.description', 'Let’s start your ConnectMe card with your name.') },
    { key: 'professional', title: t('onboarding.steps.professional.title', 'Tell us about your craft'), description: t('onboarding.steps.professional.description', 'Add your job title and company to your digital business card.') },
    { key: 'contact', title: t('onboarding.steps.contact.title', 'Additional Info'), description: t('onboarding.steps.contact.description', 'Add contact info, social media, and more. You can always change this later.') },
    { key: 'account', title: t('onboarding.steps.account.title', 'Lock it in'), description: t('onboarding.steps.account.description', 'Save your card by signing up below. Welcome to the ConnectMe family 🚀') },
  ];

  const handleBack = () => {
    // ✅ Allow all users to exit onboarding if they are on Step 0
    if (currentStep === 0) {
      onSignOut();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (showSocialModal) {
        setShowSocialModal(false);
        return true;
      }
      
      if (currentStep === 0) {
        onSignOut();
      } else {
        setCurrentStep(prev => prev - 1);
      }
      return true; 
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentStep, showSocialModal, onSignOut]);

  const handleNext = async (skipToSetup = false) => {
    let newErrors: Record<string, string> = {};
    
    if (currentStep === 0) {
      if (!profile.firstName?.trim()) newErrors.firstName = t('errors.validation.nameRequired', 'First name required');
      if (!profile.lastName?.trim()) newErrors.lastName = t('errors.validation.lastNameRequired', 'Last name required');
    }
    if (currentStep === 3 && !isGoogleUser) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email || '')) newErrors.email = t('errors.validation.emailInvalid', 'Valid email required');
      if (password.length < 8) newErrors.password = t('errors.validation.passwordWeak', 'Must be at least 8 chars');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);

    if (skipToSetup) {
      if (isGoogleUser) {
        await finishSetup();
      } else {
        setCurrentStep(3);
      }
      return;
    }

    const finalStepIndex = isGoogleUser ? 2 : 3;

    if (currentStep < finalStepIndex) {
      setCurrentStep(prev => prev + 1);
    } else {
      await finishSetup();
    }
  };

  const finishSetup = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      setSubmitError(t('errors.auth.noInternet', "Connection failed..."));
      return; 
    }
    try {
      await onComplete(profile as UserProfile, isGoogleUser ? undefined : password);
    } catch (error: any) { 
      setSubmitError(getFriendlyErrorMessage(error.code || error.message, t)); 
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setSubmitError(null);
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        setSubmitError(t('errors.auth.noInternet', "Connection failed..."));
        setGoogleLoading(false);
        return; 
      }

      await signInWithGoogle();
      await onComplete(profile as UserProfile);

    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        setSubmitError(getFriendlyErrorMessage(error.code || error.message, t));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const saveSocials = () => {
    const newLinks: any[] = [];
    if (socialInputs.linkedin) newLinks.push({ platform: 'linkedin', url: socialInputs.linkedin, isPublic: true });
    if (socialInputs.x) newLinks.push({ platform: 'x', url: socialInputs.x, isPublic: true });
    if (socialInputs.instagram) newLinks.push({ platform: 'instagram', url: socialInputs.instagram, isPublic: true });
    if (socialInputs.facebook) newLinks.push({ platform: 'facebook', url: socialInputs.facebook, isPublic: true });
    
    setProfile(prev => ({ ...prev, links: newLinks }));
    setShowSocialModal(false);
  };

  const isNextDisabled = 
    (currentStep === 0 && (!profile.firstName?.trim() || !profile.lastName?.trim())) ||
    (currentStep === 3 && !isGoogleUser && (!profile.email?.trim() || password.length < 8));

  const isFinalStep = isGoogleUser ? currentStep === 2 : currentStep === 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButtonArea}>
            <ArrowLeft size={28} color={theme.textMain} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignOut}>
            <Text style={[styles.cancelText, { color: theme.textSub }]}>{t('common.cancel', 'Cancel')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: theme.textMain }]}>{steps[currentStep].title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSub }]}>{steps[currentStep].description}</Text>

          {submitError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            {/* ✅ Step 0 is now visible to EVERYONE. Google users will see it pre-filled. */}
            {currentStep === 0 && (
              <>
                <TextInput 
                  value={profile.firstName || ''} 
                  onChangeText={(text) => setProfile({...profile, firstName: text})}
                  placeholder={t('onboarding.placeholders.firstName', 'Enter First Name')}
                  placeholderTextColor={theme.textSub}
                  style={[styles.input, { backgroundColor: inputBg, color: theme.textMain }, errors.firstName && styles.inputError]}
                />
                <TextInput 
                  value={profile.lastName || ''} 
                  onChangeText={(text) => setProfile({...profile, lastName: text})}
                  placeholder={t('onboarding.placeholders.lastName', 'Enter Last Name')}
                  placeholderTextColor={theme.textSub}
                  style={[styles.input, { backgroundColor: inputBg, color: theme.textMain }, errors.lastName && styles.inputError]}
                />
              </>
            )}

            {currentStep === 1 && (
              <>
                <TextInput 
                  value={profile.title || ''} 
                  onChangeText={(text) => setProfile({...profile, title: text})}
                  placeholder={t('onboarding.placeholders.title', 'Enter Job Title')}
                  placeholderTextColor={theme.textSub}
                  style={[styles.input, { backgroundColor: inputBg, color: theme.textMain }]}
                />
                <TextInput 
                  value={profile.company || ''} 
                  onChangeText={(text) => setProfile({...profile, company: text})}
                  placeholder={t('onboarding.placeholders.company', 'Enter Your Company')}
                  placeholderTextColor={theme.textSub}
                  style={[styles.input, { backgroundColor: inputBg, color: theme.textMain }]}
                />
              </>
            )}

            {currentStep === 2 && (
              <>
                <TextInput 
                  value={profile.phone || ''} 
                  onChangeText={(text) => setProfile({...profile, phone: text})}
                  keyboardType="phone-pad"
                  placeholder={t('onboarding.placeholders.phone', 'Enter Phone Number')}
                  placeholderTextColor={theme.textSub}
                  style={[styles.input, { backgroundColor: inputBg, color: theme.textMain }]}
                />
                <TouchableOpacity style={[styles.socialTriggerButton, { borderColor: theme.border }]} onPress={() => setShowSocialModal(true)}>
                  <Text style={[styles.socialTriggerText, { color: theme.primary }]}>
                    + {t('onboarding.buttons.addSocials', 'Add Social Links')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {currentStep === 3 && !isGoogleUser && (
              <>
                <TextInput 
                  value={profile.email || ''} 
                  onChangeText={(text) => setProfile({ ...profile, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={t('onboarding.placeholders.email', 'Enter Email Address')}
                  placeholderTextColor={theme.textSub}
                  style={[styles.input, { backgroundColor: inputBg, color: theme.textMain }, errors.email && styles.inputError]}
                />
                <TextInput 
                  value={password || ''} 
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder={t('onboarding.placeholders.password', 'Enter Password')}
                  placeholderTextColor={theme.textSub}
                  style={[styles.input, { backgroundColor: inputBg, color: theme.textMain }, errors.password && styles.inputError]}
                />
              </>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            onPress={() => handleNext(false)}
            disabled={isNextDisabled}
            style={[styles.primaryBtn, { backgroundColor: theme.primary }, isNextDisabled && styles.disabledBtn]}
          >
            <Text style={[styles.primaryBtnText, isNextDisabled && { color: 'rgba(255,255,255,0.6)' }]}>
              {isFinalStep ? t('onboarding.buttons.finish', 'Finish Setup') : t('onboarding.buttons.continue', 'Continue')}
            </Text>
          </TouchableOpacity>

          {currentStep === 0 && !isGoogleUser && (
            <View style={styles.loginRow}>
              <Text style={{ color: theme.textSub }}>Already a member? </Text>
              <TouchableOpacity onPress={onSignIn}>
                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Log In</Text>
              </TouchableOpacity>
            </View>
          )}

          {(currentStep === 1 || currentStep === 2) && (
            <TouchableOpacity onPress={() => handleNext(true)} style={styles.skipLink}>
              <Text style={{ color: theme.textSub, fontWeight: 'bold' }}>
                {isGoogleUser && currentStep === 2 ? 'Skip & Finish' : 'Skip to Account Setup'}
              </Text>
            </TouchableOpacity>
          )}

          {/* ✅ REMOVED: Google Button from Step 3 */}

        </View>

      </KeyboardAvoidingView>

      <Modal visible={showSocialModal} animationType="slide" transparent={true} onRequestClose={() => setShowSocialModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', maxHeight: '90%' }}>
            <View style={[styles.modalContent, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textMain }]}>Add Social Links</Text>
                <TouchableOpacity onPress={() => setShowSocialModal(false)} style={styles.closeBtn}>
                  <CloseIcon size={24} color={theme.textSub} />
                </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} style={{ width: '100%', marginTop: 24 }} showsVerticalScrollIndicator={false}>
                <SocialInput platform="X" label="X Profile Link" icon="x-twitter" color="#000000" value={socialInputs.x} onChange={(t: string) => setSocialInputs({...socialInputs, x: t})} theme={theme} inputBg={inputBg} isFA6 />
                <SocialInput platform="LinkedIn" label="LinkedIn Profile Link" icon="linkedin-in" color="#0077b5" value={socialInputs.linkedin} onChange={(t: string) => setSocialInputs({...socialInputs, linkedin: t})} theme={theme} inputBg={inputBg} isFA6 />
                <SocialInput platform="Instagram" label="Instagram Profile Link" icon="instagram" color="#E1306C" value={socialInputs.instagram} onChange={(t: string) => setSocialInputs({...socialInputs, instagram: t})} theme={theme} inputBg={inputBg} isFA6 />
                <SocialInput platform="Facebook" label="Facebook Profile Link" icon="facebook-f" color="#1877F2" value={socialInputs.facebook} onChange={(t: string) => setSocialInputs({...socialInputs, facebook: t})} theme={theme} inputBg={inputBg} isFA6 />
              </ScrollView>

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 16 }]} onPress={saveSocials}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function SocialInput({ platform, label, icon, color, value, onChange, theme, inputBg, isFA6 }: any) {
  return (
    <View style={styles.socialWrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.fieldLabel, { color: theme.textMain }]}>{label}</Text>
        <Info size={14} color={theme.textSub} />
      </View>
      
      <View style={styles.integratedRow}>
        <View style={[styles.iconBox, { backgroundColor: color }]}>
          {isFA6 ? (
            <FontAwesome6 name={icon} size={24} color="white" />
          ) : (
            <AntDesign name={icon} size={24} color="white" />
          )}
        </View>
        <TextInput 
          value={value}
          onChangeText={onChange}
          placeholder={`Enter ${platform} URL`}
          placeholderTextColor={theme.textSub}
          autoCapitalize="none"
          style={[styles.socialInput, { backgroundColor: inputBg, color: theme.textMain }]}
        />
      </View>
    </View>
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
  backButtonArea: { width: 40, height: 40, justifyContent: 'center' },
  cancelText: { fontWeight: 'bold', fontSize: 14 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, flexGrow: 1 },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 32 },
  errorBanner: { backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#b91c1c', fontSize: 13, fontWeight: 'bold' },
  formContainer: { width: '100%', gap: 16 },
  input: { height: 60, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, fontWeight: '500' },
  inputError: { borderWidth: 2, borderColor: '#f87171' },
  socialTriggerButton: { height: 60, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  socialTriggerText: { fontWeight: 'bold', fontSize: 16 },
  footer: { paddingHorizontal: 24, paddingTop: 16 },
  primaryBtn: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%' },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  disabledBtn: { opacity: 0.6 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  skipLink: { alignSelf: 'center', marginTop: 24 },
  googleBtn: { height: 60, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  googleIconImage: { width: 20, height: 20, marginRight: 12, resizeMode: 'contain' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  closeBtn: { backgroundColor: 'rgba(0,0,0,0.05)', padding: 8, borderRadius: 20 },
  
  socialWrapper: { marginBottom: 20, width: '100%' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: 'bold' },
  integratedRow: { flexDirection: 'row', height: 60, width: '100%' },
  iconBox: { width: 60, height: 60, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, alignItems: 'center', justifyContent: 'center' },
  socialInput: { flex: 1, height: 60, borderTopRightRadius: 16, borderBottomRightRadius: 16, paddingHorizontal: 16, fontSize: 15 }
});