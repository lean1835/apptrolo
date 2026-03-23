import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../styles/Theme';
import { BuildingIcon, BoltIcon, CloudIcon, RestoreIcon, UserIcon, LockIcon, LogoutIcon, ChevronIcon } from '../assets/Icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../services/api';

const SettingsScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [lodge, setLodge] = useState(null);
  const [prices, setPrices] = useState(null);

  const fetchData = async () => {
    try {
      const [resLodge, resPrices] = await Promise.all([
        axiosInstance.get('/lodge'),
        axiosInstance.get('/utility-prices')
      ]);
      setLodge(resLodge.data);
      setPrices(resPrices.data);
    } catch (err) {
      console.error('Fetch settings data error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const SettingItem = ({ icon: Icon, bg, lbl, sub, onPress }) => (
    <TouchableOpacity style={styles.sitem} onPress={onPress}>
      <View style={[styles.siconwrap, { backgroundColor: bg }]}>
        <Icon size={18} color="#fff" />
      </View>
      <View style={styles.sbody}>
        <Text style={styles.slbl}>{lbl}</Text>
        {sub ? <Text style={styles.ssub}>{sub}</Text> : null}
      </View>
      <View style={styles.sarr}>
        <ChevronIcon size={16} color={COLORS.g4} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.tbtitle}>Cài đặt</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cardSection}>
          <Text style={styles.secTitle}>Nhà trọ</Text>
          <SettingItem 
            icon={BuildingIcon} 
            bg="#16a34a" 
            lbl="Thông tin nhà trọ" 
            sub={lodge?.name || "Đang tải..."} 
            onPress={() => router.push('/lodge-info')} 
          />
          <SettingItem 
            icon={BoltIcon} 
            bg="#d97706" 
            lbl="Đơn giá điện / nước" 
            sub={prices ? `${Number(prices.elec).toLocaleString('vi')}đ/kWh · ${prices.waterMode === 'meter' ? Number(prices.water).toLocaleString('vi') + 'đ/m³' : Number(prices.waterFixed).toLocaleString('vi') + 'đ/ng'}` : "Đang tải..."} 
            onPress={() => router.push('/utility-price')} 
          />
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.secTitle}>Dữ liệu</Text>
          <SettingItem 
            icon={CloudIcon} 
            bg="#0284c7" 
            lbl="Sao lưu dữ liệu" 
            sub="Export JSON" 
            onPress={() => Alert.alert('Thông báo', 'Tính năng Sao lưu dữ liệu đang được phát triển.')} 
          />
          <SettingItem 
            icon={RestoreIcon} 
            bg="#7c3aed" 
            lbl="Khôi phục dữ liệu" 
            sub="Import từ file" 
            onPress={() => Alert.alert('Thông báo', 'Tính năng Khôi phục dữ liệu đang được phát triển.')} 
          />
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.secTitle}>Tài khoản</Text>
          <SettingItem 
            icon={UserIcon} 
            bg="#16a34a" 
            lbl="Thông tin tài khoản" 
            sub={user?.email || (user?.phone ? `Người dùng ${user.phone}` : 'Chưa đăng nhập')} 
            onPress={() => router.push('/account-info')} 
          />
          <SettingItem 
            icon={LockIcon} 
            bg="#475569" 
            lbl="Đổi mật khẩu" 
            sub="Xác nhận qua email" 
            onPress={() => router.push('/change-password')} 
          />
          <SettingItem 
            icon={LogoutIcon} 
            bg="#e11d48" 
            lbl="Đăng xuất" 
            sub={user?.phone || ''} 
            onPress={logout} 
          />
        </View>

        <Text style={styles.versionTxt}>App Trọ Lỏ Lỏ v1.0.0 · Made with ♥</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topbar: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 14,
    ...SHADOWS.sh,
  },
  tbtitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.g1,
  },
  scroll: {
    padding: 14,
    gap: 12,
  },
  cardSection: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    ...SHADOWS.sh,
  },
  secTitle: {
    backgroundColor: COLORS.g6,
    paddingVertical: 8,
    paddingHorizontal: 15,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.g4,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  sitem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.g6,
  },
  siconwrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sbody: {
    flex: 1,
  },
  slbl: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.g1,
  },
  ssub: {
    fontSize: 12,
    color: COLORS.g3,
    marginTop: 1,
  },
  sarr: {
    marginLeft: 'auto',
  },
  versionTxt: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.g4,
    paddingVertical: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen;
