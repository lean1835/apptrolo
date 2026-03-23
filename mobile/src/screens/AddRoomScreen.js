import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS, SIZES } from '../styles/Theme';
import { BackIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button, Input } from '../components/Common';

const AddRoomScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    ep: '0',
    wp: '0',
    status: 'empty',
    descText: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let errs = {};
    if (!form.name) errs.name = 'Vui lòng nhập tên phòng';
    if (!form.price) errs.price = 'Vui lòng nhập giá phòng';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        ep: parseFloat(form.ep) || 0,
        wp: parseFloat(form.wp) || 0,
      };
      
      await axiosInstance.post('/rooms', payload);
      Alert.alert('Thành công', 'Đã thêm phòng mới!');
      router.back();
    } catch (err) {
      console.error('Add room error:', err);
      Alert.alert('Lỗi', 'Không thể thêm phòng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
          <BackIcon size={24} color={COLORS.g2} />
        </TouchableOpacity>
        <Text style={styles.tbtitle}>Thêm phòng mới</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectit}>Thông tin cơ bản</Text>
          <Input 
            label="Tên phòng (Ví dụ: P.101)" 
            placeholder="Nhập tên phòng..."
            value={form.name}
            onChangeText={(txt) => setForm({...form, name: txt})}
            error={errors.name}
          />
          <Input 
            label="Giá thuê / tháng (VNĐ)" 
            placeholder="Ví dụ: 2500000"
            keyboardType="numeric"
            value={form.price}
            onChangeText={(txt) => setForm({...form, price: txt})}
            error={errors.price}
          />
          <Input 
            label="Mô tả / Ghi chú" 
            placeholder="Nhập mô tả về phòng..."
            multiline
            numberOfLines={3}
            value={form.descText}
            onChangeText={(txt) => setForm({...form, descText: txt})}
            style={{ height: 80, textAlignVertical: 'top' }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectit}>Chỉ số đầu kỳ</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input 
                label="Chỉ số điện (kWh)" 
                placeholder="0"
                keyboardType="numeric"
                value={form.ep}
                onChangeText={(txt) => setForm({...form, ep: txt})}
              />
            </View>
            <View style={{ width: 15 }} />
            <View style={{ flex: 1 }}>
              <Input 
                label="Chỉ số nước (m³)" 
                placeholder="0"
                keyboardType="numeric"
                value={form.wp}
                onChangeText={(txt) => setForm({...form, wp: txt})}
              />
            </View>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Button 
            title={loading ? "Đang xử lý..." : "Lưu phòng"} 
            onPress={handleSave} 
            full 
            disabled={loading}
          />
          {loading && <ActivityIndicator color={COLORS.pr} style={{ marginTop: 10 }} />}
        </View>
        
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
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sh,
  },
  tbback: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.g6,
    borderRadius: 11,
  },
  tbtitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.g1,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.sh,
  },
  sectit: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.g2,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
  },
});

export default AddRoomScreen;
