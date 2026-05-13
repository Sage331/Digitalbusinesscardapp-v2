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
  Alert,
  BackHandler,
  ActivityIndicator // ✅ Added for loading spinner
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native'; 
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeContext'; 

const getSignInErrorMessage = (errorCode: string, t: any) => {
  switch (errorCode) {
    case 'auth/network-request-failed':
      return t('errors.auth.networkError', 'Network error. Please check your connection.');
    case 'auth/user-not-found': 
      return t('errors.auth.userNotFound', "No account found with this email.");
    case 'auth/invalid-email':
      return t('errors.auth.invalidEmail', "That email address is not valid.");
    case 'auth/invalid-credential': 
      return t('errors.auth.invalidCredential', "Invalid email or password.");
    case 'auth/wrong-password': 
      return t('errors.auth.wrongPassword', "Incorrect password.");
    case 'auth/too-many-requests': 
      return t('errors.auth.tooManyRequests', "Too many attempts. Try later.");
    default: 
      return `${t('errors.auth.generic', "An error occurred")}: (${errorCode})`;
  }
};

interface SignInPageProps {
  onSignIn: (email: string, password: string, rememberMe: boolean) => Promise<void> | void;
  onForgotPassword: (email: string) => Promise<void> | void;
  onBack: () => void;
  onSignUp: () => void;
}

export function SignInPage({ onSignIn, onForgotPassword, onBack, onSignUp }: SignInPageProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const { theme, isDark } = useTheme();
  const inputBg = isDark ? theme.cardBg : '#f4f4f5';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  
  // ✅ NEW: Loading state to prevent double-taps
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (isResetMode) {
        setIsResetMode(false); 
      } else {
        onBack(); 
      }
      return true; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove(); 
  }, [isResetMode, onBack]);

  const handleSignIn = async () => {
    if (loading) return; // Block if already submitting

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(t('common.error'), t('auth.noInternet'));
      return;
    }

    setLoading(true);
    setSignInError(null);

    // ✅ 15s Safety Net: Force-unlock if Firebase hangs indefinitely
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 15000);

    try {
      await onSignIn(email, password, false);
    } catch (error: any) {
      setSignInError(getSignInErrorMessage(error.code, t));
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false); // ✅ Guaranteed to run
    }
  };

  const handleForgotPassword = async () => {
    if (loading) return;

    if (!email) {
      setSignInError(t('errors.auth.emailRequired', 'Please enter your email address first.'));
      return;
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(t('common.error'), t('auth.noInternet'));
      return;
    }

    setLoading(true);
    const safetyTimer = setTimeout(() => setLoading(false), 15000);

    try {
      await onForgotPassword(email);
      Alert.alert(
        t('auth.resetSentTitle', 'Check Your Mail'),
        `${t('auth.resetSentDesc', 'Instructions to reset your password have been sent to:')}\n\n${email}`,
        [{ text: t('common.ok'), onPress: () => setIsResetMode(false) }]
      );
    } catch (error: any) {
      setSignInError(getSignInErrorMessage(error.code, t));
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={isResetMode ? () => setIsResetMode(false) : onBack} 
            style={styles.backButtonArea}
            disabled={loading} // Prevent back navigation while processing
          >
            <ArrowLeft size={28} color={theme.textMain} />
          </TouchableOpacity>
        </View>

        <View style={styles.bodyFlex}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.textMain }]}>
                {isResetMode ? t('auth.forgotPasswordTitle', 'Reset Password') : t('auth.signInTitle', 'Welcome Back')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSub }]}>
                {isResetMode 
                  ? t('auth.forgotPasswordSubtitle', 'Enter your email to receive reset instructions.') 
                  : t('auth.signInSubtitle', 'Welcome back to your digital hub. Log in to update your card.')}
              </Text>
            </View>

            {signInError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{signInError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: theme.textMain }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                placeholder={t('auth.emailPlaceholder', 'Enter Email Address')}
                placeholderTextColor={theme.textSub}
              />

              {!isResetMode && (
                <View style={[styles.passwordContainer, { backgroundColor: inputBg }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: theme.textMain }]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                    placeholder={t('auth.passwordPlaceholder', 'Enter Password')}
                    placeholderTextColor={theme.textSub}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={22} color={theme.textSub} />
                    ) : (
                      <Eye size={22} color={theme.textSub} />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {!isResetMode && (
                <View style={styles.row}>
                  <TouchableOpacity onPress={() => setIsResetMode(true)} disabled={loading}>
                    <Text style={[styles.forgotText, { color: theme.primary }]}>{t('auth.forgotPassword', 'Forgot Password?')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ✅ UPDATED: Primary Button with Loading UI */}
              <TouchableOpacity 
                onPress={isResetMode ? handleForgotPassword : handleSignIn} 
                style={[
                  styles.primaryBtn, 
                  { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isResetMode ? t('auth.sendReset', 'Send Reset Link') : t('auth.signIn', 'Log In')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <View style={styles.footerFlex}>
          {!isResetMode && (
            <View style={styles.footerTextRow}>
              <Text style={[styles.footerTextLabel, { color: theme.textSub }]}>
                {t('auth.noAccount', 'New to ConnectMe?')}
              </Text>
              <TouchableOpacity onPress={onSignUp} disabled={loading}>
                <Text style={[styles.footerLinkText, { color: theme.primary }]}>
                  {t('auth.signUp', 'Create Account')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flex: 0.10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingTop: 4
  },
  bodyFlex: { flex: 0.65 },
  footerFlex: { flex: 0.25, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 24 },
  backButtonArea: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  titleContainer: { marginBottom: 32 },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  errorBanner: { backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#b91c1c', fontSize: 13, fontWeight: 'bold' },
  form: { width: '100%', gap: 16 },
  input: { height: 60, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, fontWeight: '500' },
  passwordContainer: { 
    height: 60, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  passwordInput: { 
    flex: 1, 
    height: '100%', 
    paddingHorizontal: 20, 
    fontSize: 16, 
    fontWeight: '500' 
  },
  eyeIcon: { 
    padding: 15, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  forgotText: { fontSize: 14, fontWeight: 'bold' },
  primaryBtn: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 8 },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  footerTextRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  footerTextLabel: { fontSize: 14, marginRight: 6 },
  footerLinkText: { fontSize: 14, fontWeight: 'bold' }
});