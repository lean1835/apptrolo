import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SHADOWS } from '../styles/Theme';
import { Input, Button } from '../components/Common';
import { BackIcon } from '../assets/Icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

const RegisterScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    lodgeName: '',
    lodgeAddress: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleRegister = async () => {
    setError('');
    const { name, phone, email, password, confirmPassword, lodgeName } = formData;
    if(!name || !phone || !email || !password || !lodgeName) {
      setError('Vui lòng điền đủ thông tin bắt buộc!');
      return;
    }
    if(password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    const result = await register(formData);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
          <BackIcon size={24} color={COLORS.g2} />
        </TouchableOpacity>
        <Text style={styles.tbtitle}>Đăng ký tài khoản</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.card}>
          <Text style={styles.ctitle}>Thông tin cá nhân</Text>
          <View style={styles.aform}>
            <Input
              label="Họ và tên *"
              value={formData.name}
              onChangeText={(txt) => setFormData({ ...formData, name: txt })}
              placeholder="Nguyễn Văn A"
            />
            <Input
              label="Số điện thoại *"
              value={formData.phone}
              onChangeText={(txt) => setFormData({ ...formData, phone: txt })}
              placeholder="0912 345 678"
              keyboardType="phone-pad"
            />
            <Input
              label="Email *"
              value={formData.email}
              onChangeText={(txt) => setFormData({ ...formData, email: txt })}
              placeholder="example@gmail.com"
            />
            <Input
              label="Mật khẩu *"
              value={formData.password}
              onChangeText={(txt) => setFormData({ ...formData, password: txt })}
              placeholder="Ít nhất 6 ký tự"
              type="password"
            />
            <Input
              label="Nhập lại mật khẩu *"
              value={formData.confirmPassword}
              onChangeText={(txt) => setFormData({ ...formData, confirmPassword: txt })}
              placeholder="Xác nhận mật khẩu"
              type="password"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.ctitle}>Thông tin nhà trọ</Text>
          <View style={styles.aform}>
            <Input
              label="Tên nhà trọ *"
              value={formData.lodgeName}
              onChangeText={(txt) => setFormData({ ...formData, lodgeName: txt })}
              placeholder="Nhà trọ Bay Lắc"
            />
            <Input
              label="Địa chỉ"
              value={formData.lodgeAddress}
              onChangeText={(txt) => setFormData({ ...formData, lodgeAddress: txt })}
              placeholder="Số nhà, đường, phường..."
            />
          </View>
        </View>

        {error ? <Text style={styles.eTxt}>{error}</Text> : null}

        <Button title="Đăng ký ngay" onPress={handleRegister} full style={{ marginBottom: 15 }} />
        
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.alink}>Đã có tài khoản? Đăng nhập</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  topbar: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.sh,
    zIndex: 10,
  },
  tbback: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.g6,
    borderRadius: 11,
  },
  tbtitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.g1,
  },
  container: {
    padding: 14,
    backgroundColor: COLORS.bg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.sh,
  },
  ctitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.g4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  aform: {
    gap: 2,
  },
  eTxt: {
    fontSize: 12,
    color: COLORS.rose,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  alink: {
    fontSize: 13,
    color: COLORS.pr,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default RegisterScreen;
