import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS, SIZES } from '../styles/Theme';
import { BackIcon, EditIcon, UserIcon, BoltIcon, DropletIcon, MoneyIcon, ReceiptIcon, DoorIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Badge, Button } from '../components/Common';
import { useFocusEffect } from '@react-navigation/native';

const RoomDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRoom = async () => {
    try {
      const res = await axiosInstance.get(`/rooms/${id}?t=${new Date().getTime()}`);
      setRoom(res.data);
    } catch (err) {
      console.error('Fetch room error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRoom();
    }, [id])
  );

  if (loading) return <View style={styles.loading}><Text>Đang tải...</Text></View>;
  if (!room) return <View style={styles.loading}><Text>Không tìm thấy phòng!</Text></View>;

  const handleCheckout = () => {
    Alert.alert(
      "Xác nhận trả phòng",
      `Bạn có chắc chắn muốn cho khách ${room.tenant} trả phòng ${room.name}?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xác nhận", 
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.put(`/rooms/${room.id}`, { 
                ...room, 
                status: 'empty', 
                tenant: '', 
                phone: '', 
                people: 0,
                members: [] 
              });
              fetchRoom();
            } catch (err) {
              Alert.alert("Lỗi", "Không thể trả phòng");
            }
          }
        }
      ]
    );
  };

  const handleDeleteRoom = () => {
    Alert.alert(
      "Xóa phòng",
      `Xóa phòng ${room.name} cùng toàn bộ dữ liệu (khách, hóa đơn, điện nước)? Hành động này không thể phục hồi.`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa vĩnh viễn", 
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(`/rooms/${room.id}`);
              router.back();
            } catch (err) {
              Alert.alert("Lỗi", "Không thể xóa phòng");
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = (mId, mName) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có muốn xóa ${mName} khỏi danh sách người ở cùng?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: async () => {
            try {
              await axiosInstance.delete(`/rooms/members/${mId}`);
              fetchRoom();
            } catch (err) {
              Alert.alert("Lỗi", "Không thể xóa người ở cùng");
            }
          } 
        }
      ]
    );
  };

  const isOccupied = room.status === 'occupied' || room.status === 'debt';

  let prevElec = room.ep || 0;
  let prevWater = room.wp || 0;
  let currElec = null;
  let currWater = null;

  if (room.meterReadings && room.meterReadings.length > 0) {
      const allSorted = [...room.meterReadings].sort((a,b) => {
          const dateDiff = new Date(b.date) - new Date(a.date);
          if (dateDiff !== 0) return dateDiff;
          return b.id - a.id;
      });

      const now = new Date();
      const thisMonthReadings = allSorted.filter(r => {
          const [y, m] = r.date.split('-');
          return parseInt(y, 10) === now.getFullYear() && parseInt(m, 10) === (now.getMonth() + 1);
      });

      const priorReadings = allSorted.filter(r => {
          const [y, m] = r.date.split('-');
          return parseInt(y, 10) < now.getFullYear() || (parseInt(y, 10) === now.getFullYear() && parseInt(m, 10) < (now.getMonth() + 1));
      });

      if (thisMonthReadings.length > 0) {
          currElec = thisMonthReadings[0].elec;
          currWater = thisMonthReadings[0].water;
      }
      
      if (priorReadings.length > 0) {
          prevElec = priorReadings[0].elec;
          prevWater = priorReadings[0].water;
      }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity 
          style={styles.tbback} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/rooms');
            }
          }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <BackIcon size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.tbtitle}>{room.name}</Text>
        <TouchableOpacity style={styles.tbedit} onPress={() => router.push({ pathname: '/edit-room', params: { id: room.id } })}>
          <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 13 }}>Sửa</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!isOccupied ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>THÔNG TIN PHÒNG</Text>
              <View style={styles.divider} />
              
              <View style={styles.drow}>
                <DoorIcon size={18} color={COLORS.g4} />
                <Text style={styles.dlbl}>Tên phòng</Text>
                <Text style={styles.dval}>{room.name}</Text>
              </View>
              
              <View style={styles.drow}>
                <MoneyIcon size={18} color={COLORS.g4} />
                <Text style={styles.dlbl}>Giá thuê</Text>
                <Text style={[styles.dval, { color: COLORS.rose }]}>{Number(room.price).toLocaleString('vi')} đ/th</Text>
              </View>

              <View style={styles.drow}>
                <Text style={styles.dlbl}>Trạng thái</Text>
                <Text style={styles.dval}>Đang trống</Text>
              </View>
            </View>

            <Button 
              title="+ Thêm khách thuê" 
              type="green"
              onPress={() => router.push({ pathname: '/add-tenant', params: { id: room.id } })} 
              full 
              style={{ marginTop: 10, paddingVertical: 15 }} 
            />
          </>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.hrow}>
                <Text style={styles.cardTitle}>NGƯỜI THUÊ CHÍNH</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-tenant', params: { id: room.id } })} style={styles.miniEdit}>
                   <Text style={{ color: COLORS.pr, fontSize: 12, fontWeight: '800' }}>Sửa</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.tenantHeader}>
                 <View style={styles.avatar}>
                    <UserIcon size={36} color={COLORS.pr} />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.tenantName}>{room.tenant || 'Chưa cập nhật tên'}</Text>
                    <Text style={styles.tenantPhone}>📞 {room.phone || 'Chưa cập nhật SĐT'}</Text>
                    <Text style={styles.tenantInfo}>Ngày vào: {room.checkin || '--/--/----'} · {Number(room.price).toLocaleString('vi')} đ/th</Text>
                    <View style={{ marginTop: 8, flexDirection: 'row' }}>
                       <Badge 
                         label={room.contract === 'quarter' ? "HĐ Quý" : room.contract === 'halfyear' ? "HĐ 6 tháng" : "Theo tháng"} 
                         type="sky" 
                       />
                       {room.contractPrepaid > 0 && (
                          <Text style={styles.prepaidLabel}> · Đã trả trước {room.contractPrepaid} tháng</Text>
                       )}
                    </View>
                 </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.hrow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                   <Text style={styles.cardTitle}>NGƯỜI Ở CÙNG</Text>
                   <Badge label={`${room.people || 1} NGƯỜI`} type="sky" />
                </View>
                <TouchableOpacity style={styles.miniAdd} onPress={() => router.push({ pathname: '/add-member', params: { roomId: room.id } })}>
                  <Text style={{ color: COLORS.pr, fontWeight: '800', fontSize: 12 }}>Thêm</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              
              {(room.members && room.members.length > 0) ? (
                room.members.map((m, idx) => (
                  <View key={idx} style={styles.mRow}>
                    <View style={styles.mIcon}><UserIcon size={18} color={COLORS.sky} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mName}>{m.name}</Text>
                      <Text style={styles.mPhone}>📞 {m.phone || 'Không có SĐT'} {m.note ? ` · ${m.note}` : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveMember(m.id, m.name)} style={{ padding: 4 }}>
                       <Text style={{ color: COLORS.rose, fontWeight: 'bold' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptySmall}>
                  <Text style={styles.emptySmallTxt}>Chưa có người ở cùng</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>ĐIỆN NƯỚC THÁNG {new Date().getMonth() + 1} / {new Date().getFullYear()}</Text>
              <View style={styles.divider} />
              
              <View style={styles.meterRow}>
                 <Text style={styles.meterLbl}>⚡ Điện kỳ trước</Text>
                 <Text style={styles.meterVal}>{prevElec} kWh</Text>
              </View>
              <View style={styles.meterRow}>
                 <Text style={styles.meterLbl}>⚡ Điện kỳ này</Text>
                 <Text style={[styles.meterVal, { color: COLORS.pr }]}>{currElec !== null ? `${currElec} kWh` : 'Chưa ghi'}</Text>
              </View>
              <View style={styles.meterRow}>
                 <Text style={styles.meterLbl}>💧 Nước kỳ trước</Text>
                 <Text style={styles.meterVal}>{prevWater} m³</Text>
              </View>
              <View style={styles.meterRow}>
                 <Text style={styles.meterLbl}>💧 Nước kỳ này</Text>
                 <Text style={[styles.meterVal, { color: COLORS.rose }]}>{currWater !== null ? `${currWater} m³` : 'Chưa ghi'}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Button 
                title="Ghi điện nước" 
                type="green" 
                icon={BoltIcon}
                onPress={() => router.push({ pathname: '/meter', params: { id: room.id } })} 
                full 
                style={{ flex: 1 }}
              />
              <Button 
                title="Hóa đơn" 
                type="green" 
                icon={ReceiptIcon}
                onPress={() => router.push({ pathname: '/bill', params: { id: room.id } })} 
                full 
                style={{ flex: 1 }}
              />
            </View>

            <Button 
              title="Trả phòng" 
              type="rose" 
              onPress={handleCheckout} 
              full 
              style={{ marginTop: 10, backgroundColor: 'transparent', borderColor: COLORS.rose, borderWidth: 1 }}
            />
          </>
        )}
        
        <Button 
          title="Xóa phòng này" 
          type="rose" 
          onPress={handleDeleteRoom} 
          full 
          style={{ marginTop: 20 }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Light green background like in screenshot
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topbar: {
    backgroundColor: '#16a34a', // Dark green header
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tbback: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 11,
  },
  tbtitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  tbedit: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scroll: {
    padding: 14,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    ...SHADOWS.sh,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  hrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dlbl: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  dval: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '800',
  },
  miniEdit: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniAdd: {
     backgroundColor: '#f0fdf4',
     paddingHorizontal: 10,
     paddingVertical: 4,
     borderRadius: 6,
  },
  tenantHeader: {
     flexDirection: 'row',
     gap: 15,
     alignItems: 'flex-start',
  },
  avatar: {
     width: 56,
     height: 56,
     borderRadius: 14,
     backgroundColor: '#dcfce7',
     alignItems: 'center',
     justifyContent: 'center',
  },
  tenantName: {
     fontSize: 16,
     fontWeight: '900',
     color: '#0f172a',
  },
  tenantPhone: {
     fontSize: 13,
     fontWeight: '700',
     color: COLORS.pr,
     marginTop: 2,
  },
  tenantInfo: {
     fontSize: 11,
     color: '#64748b',
     marginTop: 2,
     fontWeight: '600',
  },
  prepaidLabel: {
     fontSize: 11,
     color: COLORS.sky,
     fontWeight: '800',
  },
  mRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  mPhone: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  emptySmall: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptySmallTxt: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  meterRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     paddingVertical: 8,
  },
  meterLbl: {
     fontSize: 13,
     color: '#64748b',
     fontWeight: '600',
  },
  meterVal: {
     fontSize: 13,
     fontWeight: '800',
     color: '#0f172a',
  },
  actionRow: {
     flexDirection: 'row',
     gap: 10,
  },
});

export default RoomDetailScreen;
