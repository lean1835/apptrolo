// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { Input, Button } from '../../../components/Common';
import { BackIcon, AlertTriangleIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateWhitespace } from '../../../utils/formUtils';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const handleRequestOTP = async () => {
    setError('');
    const emailErr = validateWhitespace(email);

    if (emailErr) {
      setError('Vui lòng nhập Email để khôi phục mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', {
        email: email.trim(),
      });
      Alert.alert(
        "Thành công",
        "Mã xác thực OTP đã được gửi đến email đăng ký của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/Spam).",
        [{ text: "OK", onPress: () => setStep(2) }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || "Không tìm thấy tài khoản phù hợp.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    const otpErr = validateWhitespace(otp);
    const passErr = validateWhitespace(newPassword);
    const confirmErr = validateWhitespace(confirmPassword);

    if (otpErr || passErr || confirmErr) {
      setError('Vui lòng điền đầy đủ các thông tin xác thực.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải dài ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới nhập lại không khớp.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });
      Alert.alert(
        "Thành công",
        "Đặt lại mật khẩu mới thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.",
        [{ text: "Đăng nhập", onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || "Mã OTP không chính xác hoặc hết hạn.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, paddingBottom: insets.bottom }}
    >
      <View style={[styles.topbar, { paddingTop: Math.max(insets.top + 10, 24) }]}>
        <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
          <BackIcon size={24} color={COLORS.g2} />
        </TouchableOpacity>
        <Text style={styles.tbtitle}>Đặt lại mật khẩu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.ctitle}>Bước 1: Nhập thông tin tài khoản</Text>
            <View style={styles.aform}>
              <Input
                label="Email đăng ký *"
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                keyboardType="email-address"
              />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.ctitle}>Bước 2: Xác nhận OTP & Đặt mật khẩu</Text>
            <View style={styles.aform}>
              <Input
                label="Mã OTP xác thực *"
                value={otp}
                onChangeText={setOtp}
                placeholder="Nhập mã OTP 6 số"
                keyboardType="number-pad"
              />
              <Input
                label="Mật khẩu mới *"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Ít nhất 6 ký tự"
                type="password"
              />
              <Input
                label="Nhập lại mật khẩu mới *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Xác nhận mật khẩu"
                type="password"
              />
            </View>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBanner}>
            <AlertTriangleIcon size={18} color={COLORS.rose} />
            <Text style={styles.eTxt}>{error}</Text>
          </View>
        )}

        <Button
          title={loading ? "Đang xử lý..." : step === 1 ? "Gửi mã OTP" : "Đặt lại mật khẩu"}
          onPress={step === 1 ? handleRequestOTP : handleResetPassword}
          full
          style={{ marginBottom: 15 }}
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.alink}>Quay lại trang Đăng nhập</Text>
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  eTxt: {
    fontSize: 13,
    color: COLORS.rose,
    fontWeight: '700',
    flexShrink: 1,
  },
  alink: {
    fontSize: 13,
    color: COLORS.pr,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;
