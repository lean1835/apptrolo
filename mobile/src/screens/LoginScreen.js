import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../styles/Theme';
import { Input, Button } from '../components/Common';
import { BuildingIcon, CheckIcon } from '../assets/Icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

const LoginScreen = () => {
  const router = useRouter();
  const [phone, setPhone] = useState('0912345678');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    setError('');
    const result = await login(phone, password);
    if (!result.success) {
      setError(result.error);
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
          <Text style={styles.atitle}>App Trọ</Text>
          <Text style={styles.asub}>Quản lý nhà trọ thông minh</Text>

          <View style={styles.aform}>
            <Input
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="0912 345 678"
              keyboardType="phone-pad"
            />
            <Input
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              type="password"
            />

            {error ? (
              <View style={styles.etxtRow}>
                <Text style={styles.etxt}>⚠️ {error}</Text>
              </View>
            ) : null}

            <Button
              title="Đăng nhập"
              icon={CheckIcon}
              onPress={handleLogin}
              full
              style={{ marginTop: 10 }}
            />
            
            <Text style={styles.hintTxt}>SĐT mẫu: 0912345678 · MK: 123456</Text>

            <View style={styles.divline}>
              <View style={styles.hr} />
              <Text style={styles.divText}>hoặc</Text>
              <View style={styles.hr} />
            </View>

            <Button
              title="Quên mật khẩu?"
              type="secondary"
              onPress={() => {}} // Not implemented flow for now
              full
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.alink}>Chưa có tài khoản? Đăng ký ngay</Text>
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
