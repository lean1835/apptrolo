import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../../../styles/Theme';
import { Input, Button } from '../../../components/Common';
import { CheckIcon, AlertTriangleIcon } from '../../../assets/Icons';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../../context/LanguageContext';
import { validateWhitespace } from '../../../utils/formUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(logoAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(formAnim, {
          toValue: 1,
          duration: 500,
          delay: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setSubmitted(true);
    setError('');
 
    // Security check: Validate against empty or whitespace-only inputs (Section 9.3 SkillFE.md)
    const phoneValErr = validateWhitespace(phone);
    if (phoneValErr) {
      setError(t('phoneEmpty'));
      return;
    }
 
    const pwdValErr = validateWhitespace(password);
    if (pwdValErr) {
      setError(t('passwordEmpty'));
      return;
    }
 
    // Security check: Trim inputs before API payload transmission (Section 9.4 SkillFE.md)
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
 
    setIsLoading(true);
    const result = await login(trimmedPhone, trimmedPassword);
    setIsLoading(false);

    if (!result.success) {
      const errMsg = result.error || t('systemError');
      setError(errMsg);
      Alert.alert('Lỗi đăng nhập', errMsg);
    }
  };
 
  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero gradient header */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <LinearGradient
              colors={['#14532d', '#15803d', '#16a34a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroGradient, { paddingTop: Math.max(insets.top + 20, 48) }]}
            >
              {/* Decorative circles */}
              <View style={styles.decoCircle1} />
              <View style={styles.decoCircle2} />
              <View style={styles.decoCircle3} />

              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    opacity: logoAnim,
                    transform: [
                      {
                        scale: logoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                      {
                        translateY: logoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.logoGlow}>
                  <Image
                    source={require('../../../../assets/images/renthome.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.brandName}>{t('loginTitle')}</Text>
                <Text style={styles.brandSlogan}>{t('loginSub')}</Text>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formAnim,
                transform: [
                  {
                    translateY: formAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.formTitle}>Đăng nhập</Text>
            <Text style={styles.formSubtitle}>
              Nhập thông tin tài khoản để tiếp tục
            </Text>

            <View style={styles.formFields}>
              <Input
                label={t('phone')}
                value={phone}
                onChangeText={setPhone}
                placeholder="0912 345 678"
                keyboardType="phone-pad"
                error={submitted && phone === '' ? t('phoneEmpty') : null}
              />
              <Input
                label={t('password')}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                type="password"
                error={submitted && password === '' ? t('passwordEmpty') : null}
              />

              {!!error && (
                <View style={styles.errorBanner}>
                  <AlertTriangleIcon size={18} color={COLORS.rose} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#15803d', '#16a34a', '#22c55e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtnGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <CheckIcon size={18} color="#fff" />
                      <Text style={styles.loginBtnText}>{t('loginBtn')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotBtnText}>{t('forgotPwd')}</Text>
            </TouchableOpacity>

            {/* Register link */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register' as any)}
              activeOpacity={0.7}
              style={styles.registerLink}
            >
              <Text style={styles.registerText}>
                Chưa có tài khoản?{' '}
                <Text style={styles.registerHighlight}>Đăng ký ngay</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Text style={styles.footer}>
            © {new Date().getFullYear()} Nhà Trọ Số
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroGradient: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  // Decorative background circles
  decoCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -40,
    right: -60,
  },
  decoCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: 10,
    left: -30,
  },
  decoCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: 60,
    left: 40,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 10,
  },
  logoGlow: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    ...SHADOWS.sh2,
    shadowColor: '#000',
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  brandSlogan: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Form card
  formCard: {
    marginHorizontal: 16,
    marginTop: -24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    paddingTop: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.sh2,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 20,
  },
  formFields: {
    gap: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.rose,
    fontWeight: '700',
    flexShrink: 1,
  },
  loginBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    ...SHADOWS.sh2,
    shadowColor: '#16a34a',
  },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  forgotBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  forgotBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  registerLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  registerHighlight: {
    color: COLORS.pr,
    fontWeight: '800',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
    paddingVertical: 20,
    marginTop: 'auto',
  },
});

export default LoginScreen;
