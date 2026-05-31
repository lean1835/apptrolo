// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS, SIZES } from '../../../styles/Theme';
import { BackIcon, UserIcon, BoltIcon, MoneyIcon, ReceiptIcon, DoorIcon, RestoreIcon, PlusUserIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Badge, Button } from '../../../components/Common';
import { useFocusEffect } from '@react-navigation/native';

const RoomDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const fetchRoomHistory = useCallback(async (rid) => {
    const targetId = rid || room?._id || room?.id || id;
    if (!targetId) return;
    setHistoryLoading(true);
    try {
      const res = await axiosInstance.get(`/rooms/${targetId}/history`);
      setHistoryItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch room history error:', err);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [room, id]);

  const openHistoryModal = () => {
    setShowHistoryModal(true);
    fetchRoomHistory(room?._id || room?.id || id);
  };

  const getHistoryStyle = (type) => {
    switch (type) {
      case 'checkout':
        return { Icon: DoorIcon, iconColor: COLORS.rose, iconBg: '#ffe4e6' };
      case 'tenant_old':
        return { Icon: UserIcon, iconColor: '#64748b', iconBg: '#f1f5f9' };
      case 'tenant_new':
        return { Icon: UserIcon, iconColor: COLORS.pr, iconBg: '#dcfce7' };
      case 'member':
        return { Icon: PlusUserIcon, iconColor: COLORS.sky, iconBg: '#e0f2fe' };
      case 'meter':
        return { Icon: BoltIcon, iconColor: COLORS.pr, iconBg: '#dcfce7' };
      case 'payment':
        return { Icon: MoneyIcon, iconColor: '#b45309', iconBg: '#fef3c7' };
      default:
        return { Icon: RestoreIcon, iconColor: COLORS.g3, iconBg: COLORS.g6 };
    }
  };

  if (loading) return <View style={styles.loading}><Text>Đang tải...</Text></View>;
  if (!room) return <View style={styles.loading}><Text>Không tìm thấy phòng!</Text></View>;

  const handleCheckout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Bạn có chắc chắn muốn cho khách ${room.tenant} trả phòng ${room.name}?`);
      if (confirmed) {
        (async () => {
          try {
            const roomId = room._id || room.id || id;
            await axiosInstance.put(`/rooms/${roomId}`, { 
              ...room, 
              status: 'empty', 
              tenant: '', 
              phone: '', 
              people: 0,
              checkin: '',
              members: [] 
            });
            fetchRoom();
          } catch (err) {
            alert("Lỗi: Không thể trả phòng. Chi tiết: " + (err.response?.data?.message || err.message));
          }
        })();
      }
      return;
    }

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
              const roomId = room._id || room.id || id;
              await axiosInstance.put(`/rooms/${roomId}`, { 
                ...room, 
                status: 'empty', 
                tenant: '', 
                phone: '', 
                people: 0,
                checkin: '',
                members: [] 
              });
              fetchRoom();
            } catch (err) {
              Alert.alert("Lỗi", "Không thể trả phòng: " + (err.response?.data?.message || err.message));
            }
          }
        }
      ]
    );
  };

  const handleDeleteRoom = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Xóa phòng ${room.name} cùng toàn bộ dữ liệu (khách, hóa đơn, điện nước)? Hành động này không thể phục hồi.`);
      if (confirmed) {
        (async () => {
          try {
            const roomId = room._id || room.id || id;
            await axiosInstance.delete(`/rooms/${roomId}`);
            router.back();
          } catch (err) {
            alert("Lỗi: Không thể xóa phòng. Chi tiết: " + (err.response?.data?.message || err.message));
          }
        })();
      }
      return;
    }

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
              const roomId = room._id || room.id || id;
              await axiosInstance.delete(`/rooms/${roomId}`);
              router.back();
            } catch (err) {
              Alert.alert("Lỗi", "Không thể xóa phòng: " + (err.response?.data?.message || err.message));
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = (mId, mName) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Bạn có muốn xóa ${mName} khỏi danh sách người ở cùng?`);
      if (confirmed) {
        (async () => {
          try {
            await axiosInstance.delete(`/rooms/members/${mId}`);
            fetchRoom();
          } catch (err) {
            alert("Lỗi: Không thể xóa người ở cùng. Chi tiết: " + (err.response?.data?.message || err.message));
          }
        })();
      }
      return;
    }

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
              Alert.alert("Lỗi", "Không thể xóa người ở cùng: " + (err.response?.data?.message || err.message));
            }
          } 
        }
      ]
    );
  };

  const isOccupied = room.status === 'occupied' || room.status === 'debt';
  const roomId = room._id || room.id || id;

  let prevElec = room.ep || 0;
  let prevWater = room.wp || 0;
  let currElec = null;
  let currWater = null;

  const checkinDateStr = room.checkin || '';
  const filteredReadings = (room.meterReadings || []).filter(r => !checkinDateStr || r.date >= checkinDateStr);
  const filteredBills = (room.bills || []).filter(b => !checkinDateStr || b.date >= checkinDateStr);
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (typeof dateStr !== 'string') return new Date(dateStr);
    if (dateStr.includes('T')) {
      return new Date(dateStr);
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return new Date(dateStr);
  };

  const historyPaidTotal = historyItems
    .filter((item) => item.type === 'payment')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  if (filteredReadings.length > 0) {
      const allSorted = [...filteredReadings].sort((a,b) => {
          const dateDiff = new Date(b.date) - new Date(a.date);
          if (dateDiff !== 0) return dateDiff;
          return (b.id || b._id || '').toString().localeCompare((a.id || a._id || '').toString());
      });

      const thisMonthReadings = [];
      const priorReadings = [];

      allSorted.forEach(r => {
          const [ry, rm] = r.date.split('-');
          const rYear = parseInt(ry, 10);
          const rMonth = parseInt(rm, 10);

          const isPaid = filteredBills.some(b => {
              if (!b.collected) return false;
              const [by, bm] = b.date.split('-');
              return parseInt(by, 10) === rYear && parseInt(bm, 10) === rMonth;
          });

          if (isPaid) {
              priorReadings.push(r);
          } else {
              thisMonthReadings.push(r);
          }
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

  const getEarlyWarningInfo = () => {
    const today = new Date();
    
    // 1. Check room creation date if it is in the future
    if (room?.createdAt) {
        const createdDate = parseDate(room.createdAt);
        const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (todayDateOnly < createdDateOnly) {
            return { isEarly: true, expectedDate: createdDate };
        }
    }
    
    if (!room?.checkin) return { isEarly: false, expectedDate: null };
    const checkinDate = parseDate(room.checkin);
    if (isNaN(checkinDate.getTime())) return { isEarly: false, expectedDate: null };
    
    let latestDate = new Date(checkinDate);
    if (filteredReadings && filteredReadings.length > 0) {
        filteredReadings.forEach(r => {
            const d = parseDate(r.date);
            if (!isNaN(d.getTime()) && d > latestDate) {
                latestDate = d;
            }
        });
    }
    
    const expectedDate = new Date(latestDate);
    expectedDate.setMonth(expectedDate.getMonth() + 1);
    expectedDate.setDate(checkinDate.getDate());
    
    const allowedStart = new Date(expectedDate);
    allowedStart.setDate(allowedStart.getDate() - 3);
    
    const isEarly = today < allowedStart;
    
    return { isEarly, expectedDate };
  };
  const { isEarly, expectedDate } = getEarlyWarningInfo();

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
        <View style={styles.tbActions}>
          <TouchableOpacity
            style={styles.tbIconBtn}
            onPress={openHistoryModal}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Lịch sử phòng"
          >
            <RestoreIcon size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tbedit}
            onPress={() => router.push({ pathname: '/edit-room', params: { id: roomId } })}
          >
            <Text style={styles.tbeditTxt}>Sửa</Text>
          </TouchableOpacity>
        </View>
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
              onPress={() => router.push({ pathname: '/add-tenant', params: { id: roomId } })} 
              full 
              style={{ marginTop: 10, paddingVertical: 15 }} 
            />
          </>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.hrow}>
                <Text style={styles.cardTitle}>NGƯỜI THUÊ CHÍNH</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-tenant', params: { id: room._id || room.id || id } })} style={styles.miniEdit}>
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
                <TouchableOpacity style={styles.miniAdd} onPress={() => router.push({ pathname: '/add-member', params: { roomId } })}>
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
                    <TouchableOpacity onPress={() => handleRemoveMember(m._id || m.id, m.name)} style={{ padding: 4 }}>
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
                onPress={() => router.push({ pathname: '/meter', params: { id: roomId } })} 
                full 
                style={{ flex: 1 }}
              />
              <Button 
                title="Hóa đơn" 
                type="green" 
                icon={ReceiptIcon}
                onPress={() => router.push({ pathname: '/bill', params: { id: roomId } })} 
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

      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowHistoryModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lịch sử phòng</Text>
              <Text style={styles.modalSubtitle}>
                {room.name} · {historyItems.length} hoạt động
                {historyPaidTotal > 0 ? ` · Đã thu ${historyPaidTotal.toLocaleString('vi')} đ` : ''}
              </Text>
            </View>

            {historyLoading ? (
              <View style={styles.paidEmpty}>
                <Text style={styles.paidEmptyTxt}>Đang tải lịch sử...</Text>
              </View>
            ) : historyItems.length > 0 ? (
              <ScrollView style={styles.paidList} showsVerticalScrollIndicator={false}>
                {historyItems.map((item) => {
                  const { Icon, iconColor, iconBg } = getHistoryStyle(item.type);
                  return (
                    <View key={item.key} style={styles.paidRow}>
                      <View style={[styles.paidRowIcon, { backgroundColor: iconBg }]}>
                        <Icon size={18} color={iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.paidRowPeriod}>{item.title}</Text>
                        <Text style={styles.paidRowMeta}>{item.subtitle}</Text>
                        <Text style={styles.paidRowDate}>{item.dateLabel}</Text>
                      </View>
                      {item.amount != null ? (
                        <Text style={styles.paidRowAmount}>
                          {item.amount.toLocaleString('vi')} đ
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.paidEmpty}>
                <Text style={styles.paidEmptyTxt}>Chưa có hoạt động nào</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={styles.modalCloseBtnTxt}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  tbActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tbIconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 11,
  },
  tbedit: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tbeditTxt: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
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
  earlyWarningTag: {
     backgroundColor: COLORS['amber-l'],
     borderWidth: 1,
     borderColor: COLORS.amber,
     borderRadius: 12,
     padding: 12,
     marginBottom: 12,
  },
  earlyWarningTagTxt: {
     color: '#b45309',
     fontSize: 12,
     fontWeight: '700',
     lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 35,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  paidSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  paidSummaryLbl: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  paidSummaryVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.pr,
  },
  paidList: {
    maxHeight: 280,
    marginBottom: 16,
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paidRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidRowPeriod: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  paidRowMeta: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  paidRowDate: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
    marginTop: 3,
  },
  paidRowAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.pr,
  },
  paidEmpty: {
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  paidEmptyTxt: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.g6,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseBtnTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
});

export default RoomDetailScreen;

