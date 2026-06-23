// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../../styles/Theme';
import { BuildingIcon, BoltIcon, CloudIcon, RestoreIcon, UserIcon, LockIcon, LogoutIcon, ChevronIcon } from '../../../assets/Icons';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
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

  const SettingItem = ({ icon: Icon, iconColor, iconBg, lbl, sub, onPress }) => (
    <TouchableOpacity style={styles.sitem} onPress={onPress}>
      <View style={[styles.siconwrap, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconColor} />
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
      <View style={[styles.topbar, { paddingTop: Math.max(insets.top + 10, 24) }]}>
        <Text style={styles.tbtitle}>Cài đặt</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.cardSection}>
          <Text style={styles.secTitle}>Nhà trọ</Text>
          <SettingItem 
            icon={BuildingIcon} 
            iconColor="#16a34a"
            iconBg="rgba(22, 163, 74, 0.1)"
            lbl="Thông tin nhà trọ" 
            sub={lodge?.name || "Đang tải..."} 
            onPress={() => router.push('/lodge-info')} 
          />
          <SettingItem 
            icon={BoltIcon} 
            iconColor="#d97706"
            iconBg="rgba(217, 119, 6, 0.1)"
            lbl="Đơn giá điện / nước" 
            sub={prices ? `${Number(prices.elec).toLocaleString('vi')}đ/kWh · ${prices.waterMode === 'meter' ? Number(prices.water).toLocaleString('vi') + 'đ/m³' : Number(prices.waterFixed).toLocaleString('vi') + 'đ/ng'}` : "Đang tải..."} 
            onPress={() => router.push('/utility-price')} 
          />
        </View>


        <View style={styles.cardSection}>
          <Text style={styles.secTitle}>Tài khoản</Text>
          <SettingItem 
            icon={UserIcon} 
            iconColor="#16a34a"
            iconBg="rgba(22, 163, 74, 0.1)"
            lbl="Thông tin tài khoản" 
            sub={user?.email || (user?.phone ? `Người dùng ${user.phone}` : 'Chưa đăng nhập')} 
            onPress={() => router.push('/account-info')} 
          />
          <SettingItem 
            icon={LockIcon} 
            iconColor="#475569"
            iconBg="rgba(71, 85, 105, 0.1)"
            lbl="Đổi mật khẩu" 
            sub="Xác nhận qua email" 
            onPress={() => router.push('/change-password')} 
          />
          <SettingItem 
            icon={LogoutIcon} 
            iconColor="#e11d48"
            iconBg="rgba(225, 29, 72, 0.1)"
            lbl="Đăng xuất" 
            sub={user?.phone || ''} 
            onPress={logout} 
          />
        </View>

        <Text style={styles.versionTxt}>Hệ thống quản lý nhà trọ v1.0.2 · </Text>
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
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.sh,
  },
  tbtitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.g1,
    letterSpacing: -0.3,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  cardSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...SHADOWS.sh,
  },
  secTitle: {
    backgroundColor: COLORS.g6,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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

