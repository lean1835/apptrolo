import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../../styles/Theme';
import { Input, Button } from '../../../components/Common';
import { BuildingIcon, CheckIcon } from '../../../assets/Icons';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../../context/LanguageContext';
import { validateWhitespace } from '../../../utils/formUtils';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useAuth();

  const [phone, setPhone] = useState<string>('0912345678');
  const [password, setPassword] = useState<string>('123456');
  const [error, setError] = useState<string>('');

  const handleLogin = async () => {
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

    const result = await login(trimmedPhone, trimmedPassword);
    if (!result.success) {
      setError(result.error || t('systemError'));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.awrap}>
          <View style={styles.alogo}>
            <BuildingIcon size={36} color="#fff" />
          </View>
          <Text style={styles.atitle}>{t('loginTitle')}</Text>
          <Text style={styles.asub}>{t('loginSub')}</Text>

          <View style={styles.aform}>
            <Input
              label={t('phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder="0912 345 678"
              keyboardType="phone-pad"
              error={phone === '' ? t('phoneEmpty') : null}
            />
            <Input
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              type="password"
              error={password === '' ? t('passwordEmpty') : null}
            />

            {!!error && (
              <View style={styles.etxtRow}>
                <Text style={styles.etxt}>⚠️ {error}</Text>
              </View>
            )}

            <Button
              title={t('loginBtn')}
              icon={CheckIcon}
              onPress={handleLogin}
              full
              style={{ marginTop: 10 }}
            />
            
            <Text style={styles.hintTxt}>SĐT mẫu: 0912345678 · MK: 123456</Text>

            <View style={styles.divline}>
              <View style={styles.hr} />
              <Text style={styles.divText}>{t('or')}</Text>
              <View style={styles.hr} />
            </View>

            <Button
              title={t('forgotPwd')}
              type="secondary"
              onPress={() => {}} // Not implemented flow for now
              full
            />
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.alink}>{t('noAccount')}</Text>
            </TouchableOpacity>

          </View>
          <View style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
  },
  awrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 24,
    gap: 16,
  },
  alogo: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.pr,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sh2,
    shadowColor: COLORS.pr,
    marginTop: 10,
  },
  atitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.g1,
  },
  asub: {
    fontSize: 14,
    color: COLORS.g3,
    textAlign: 'center',
    marginTop: -6,
    fontWeight: '600',
  },
  aform: {
    width: '100%',
    gap: 12,
  },
  etxtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etxt: {
    fontSize: 12,
    color: COLORS.rose,
    fontWeight: '700',
  },
  hintTxt: {
    fontSize: 11,
    color: COLORS.g4,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: -4,
  },
  divline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginVertical: 10,
  },
  hr: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.g5,
  },
  divText: {
    fontSize: 12,
    color: COLORS.g4,
    fontWeight: '600',
  },
  alink: {
    fontSize: 13,
    color: COLORS.pr,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default LoginScreen;
