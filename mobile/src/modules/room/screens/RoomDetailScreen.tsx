// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Platform, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SIZES } from '../../../styles/Theme';
import { BackIcon, UserIcon, BoltIcon, MoneyIcon, ReceiptIcon, DoorIcon, RestoreIcon, PlusUserIcon, DropletIcon, EditIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Badge, Button } from '../../../components/Common';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RoomDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [prices, setPrices] = useState(null);

  const fetchRoom = async () => {
    try {
      const res = await axiosInstance.get(`/rooms/${id}?t=${new Date().getTime()}`);
      setRoom(res.data);
      const resPrices = await axiosInstance.get(`/utility-prices`);
      setPrices(resPrices.data);
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.pr} />
        <Text style={{ marginTop: 10, color: COLORS.g3, fontWeight: '600', fontSize: 13 }}>Đang tải thông tin phòng...</Text>
      </View>
    );
  }
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
  const { isEarly } = getEarlyWarningInfo();

  const getInitials = (name) => {
    if (!name) return 'KT';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(room.tenant);

  // Delta usage calculations
  const elecUsage = (currElec !== null) ? (currElec - prevElec) : null;
  const waterUsage = (currWater !== null) ? (currWater - prevWater) : null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#14532d', '#15803d', '#16a34a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topbar, { paddingTop: Math.max(insets.top + 10, 24) }]}
      >
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
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!isOccupied ? (
          <>
            {/* Empty Room Vector Banner */}
            <View style={styles.emptyStateBanner}>
              <View style={[styles.emptyStateIconBadge, { backgroundColor: 'rgba(100, 116, 139, 0.08)' }]}>
                <DoorIcon size={32} color="#64748b" />
              </View>
              <Text style={styles.emptyStateTitle}>Phòng đang trống</Text>
              <Text style={styles.emptyStateSub}>
                Hiện tại chưa có thông tin khách hàng ở trong phòng này. Hãy thêm khách thuê để bắt đầu ghi chỉ số điện nước & lập hóa đơn hàng tháng.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>THÔNG TIN PHÒNG</Text>
              <View style={styles.divider} />
              
              <View style={styles.leaseGrid}>
                <View style={[styles.leaseItem, { width: '100%' }]}>
                  <Text style={styles.leaseLabel}>ĐƠN GIÁ THUÊ</Text>
                  <Text style={[styles.leaseValue, { fontSize: 16, color: COLORS.rose }]}>
                    {Number(room.price).toLocaleString('vi')} đ/tháng
                  </Text>
                </View>
                <View style={styles.leaseItem}>
                  <Text style={styles.leaseLabel}>TÊN PHÒNG</Text>
                  <Text style={styles.leaseValue}>{room.name}</Text>
                </View>
                <View style={styles.leaseItem}>
                  <Text style={styles.leaseLabel}>TRẠNG THÁI</Text>
                  <Text style={styles.leaseValue}>Còn trống</Text>
                </View>
              </View>
            </View>

            <Button 
              title="+ Thêm khách thuê mới" 
              type="green"
              onPress={() => router.push({ pathname: '/add-tenant', params: { id: roomId } })} 
              full 
              style={{ marginTop: 8, paddingVertical: 15 }} 
            />
          </>
        ) : (
          <>
            {/* Primary Tenant Card */}
            <View style={styles.card}>
              <View style={styles.hrow}>
                <Text style={styles.cardTitle}>NGƯỜI THUÊ CHÍNH</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-tenant', params: { id: roomId } })} style={styles.miniEdit}>
                   <Text style={{ color: COLORS.pr, fontSize: 12, fontWeight: '850' }}>Sửa</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.tenantHeader}>
                 <View style={[styles.avatarCircle, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                    <Text style={[styles.avatarText, { color: COLORS.pr }]}>{initials}</Text>
                 </View>
                 <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.tenantName}>{room.tenant || 'Chưa cập nhật tên'}</Text>
                    <Text style={styles.tenantPhone}>📞 {room.phone || 'Chưa cập nhật SĐT'}</Text>
                 </View>
              </View>

              {/* Structured Lease Info Grid */}
              <View style={styles.leaseGrid}>
                <View style={styles.leaseItem}>
                  <Text style={styles.leaseLabel}>GIÁ THUÊ</Text>
                  <Text style={styles.leaseValue}>{Number(room.price).toLocaleString('vi')}đ/th</Text>
                </View>
                <View style={styles.leaseItem}>
                  <Text style={styles.leaseLabel}>NGÀY VÀO</Text>
                  <Text style={styles.leaseValue}>{room.checkin || '--/--/----'}</Text>
                </View>
                <View style={styles.leaseItem}>
                  <Text style={styles.leaseLabel}>HỢP ĐỒNG</Text>
                  <Text style={styles.leaseValue}>
                    {room.contract === 'quarter' ? "Theo quý" : room.contract === 'halfyear' ? "6 tháng" : "Theo tháng"}
                  </Text>
                </View>
                <View style={styles.leaseItem}>
                  <Text style={styles.leaseLabel}>ĐÃ TRẢ TRƯỚC</Text>
                  <Text style={styles.leaseValue}>
                    {room.contractPrepaid > 0 ? `${room.contractPrepaid} tháng` : "Không có"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Roommates Card */}
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
                room.members.map((m, idx) => {
                  const mInitials = getInitials(m.name);
                  return (
                    <View key={idx} style={styles.mRow}>
                      <View style={[styles.avatarCircleSmall, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
                         <Text style={[styles.avatarTextSmall, { color: COLORS.sky }]}>{mInitials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mName}>{m.name}</Text>
                        <Text style={styles.mPhone}>📞 {m.phone || 'Không có SĐT'} {m.note ? ` · ${m.note}` : ''}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveMember(m._id || m.id, m.name)} style={styles.deleteMemberBtn}>
                         <Text style={styles.deleteMemberTxt}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptySmall}>
                  <Text style={styles.emptySmallTxt}>Chưa có người ở cùng</Text>
                </View>
              )}
            </View>



            {/* Action Panel Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>QUẢN LÝ & THAO TÁC</Text>
              <View style={styles.divider} />
              
              <View style={styles.actionColumn}>
                {/* Main Action: Ghi điện nước */}
                <TouchableOpacity 
                  style={styles.btnPrimaryAction}
                  onPress={() => router.push({ pathname: '/meter', params: { id: roomId } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.btnActionIconWrap}>
                    <BoltIcon size={18} color="#fff" />
                  </View>
                  <Text style={styles.btnActionTxt}>Ghi số điện nước</Text>
                </TouchableOpacity>

                <View style={styles.actionRowGrid}>
                  {/* Edit Room Button */}
                  <TouchableOpacity 
                    style={[styles.btnSecondaryAction, { borderColor: COLORS.g5 }]}
                    onPress={() => router.push({ pathname: '/edit-room', params: { id: roomId } })}
                    activeOpacity={0.8}
                  >
                    <EditIcon size={16} color={COLORS.g2} />
                    <Text style={styles.btnSecondaryTxt}>Sửa phòng</Text>
                  </TouchableOpacity>

                  {/* Checkout Room Button */}
                  <TouchableOpacity 
                    style={[styles.btnSecondaryAction, { borderColor: COLORS.rose, backgroundColor: 'rgba(225, 29, 72, 0.02)' }]}
                    onPress={handleCheckout}
                    activeOpacity={0.8}
                  >
                    <DoorIcon size={16} color={COLORS.rose} />
                    <Text style={[styles.btnSecondaryTxt, { color: COLORS.rose }]}>Trả phòng</Text>
                  </TouchableOpacity>
                </View>

                {/* Destructive Action: Delete Room */}
                <TouchableOpacity 
                  style={styles.btnDeleteAction}
                  onPress={handleDeleteRoom}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnDeleteTxt}>Xóa phòng này</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* History bottom sheet modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowHistoryModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.sheetHandle} />
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
    backgroundColor: '#f8fafc',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topbar: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.sh,
  },
  tbback: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
  },
  tbtitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
  },
  tbedit: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tbeditTxt: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
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
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.8,
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
     gap: 16,
     alignItems: 'flex-start',
  },
  avatarCircle: {
     width: 56,
     height: 56,
     borderRadius: 28,
     alignItems: 'center',
     justifyContent: 'center',
  },
  avatarText: {
     fontSize: 18,
     fontWeight: '900',
  },
  avatarCircleSmall: {
     width: 36,
     height: 36,
     borderRadius: 18,
     alignItems: 'center',
     justifyContent: 'center',
  },
  avatarTextSmall: {
     fontSize: 13,
     fontWeight: '900',
  },
  tenantName: {
     fontSize: 17,
     fontWeight: '950',
     color: '#0f172a',
  },
  tenantPhone: {
     fontSize: 13,
     fontWeight: '700',
     color: COLORS.pr,
     marginTop: 2,
  },
  mRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  deleteMemberBtn: {
    padding: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffe4e6',
  },
  deleteMemberTxt: {
    color: COLORS.rose,
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 14,
    marginTop: -2,
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btnOutline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineTxt: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 35,
    maxHeight: '80%',
    ...SHADOWS.sh2,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
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
  leaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  leaseItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  leaseLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  leaseValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  utilityGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  utilityBox: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  utilityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilityTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utilityIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityBoxTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  utilityDeltaBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  utilityDeltaTxt: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.amber,
  },
  utilityIndexRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 2,
  },
  utilityIndexMain: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  utilityUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 3,
  },
  utilityIndexSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  actionColumn: {
    gap: 12,
  },
  btnPrimaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.pr,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...SHADOWS.sh2,
  },
  btnActionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  actionRowGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnSecondaryTxt: {
    color: COLORS.g1,
    fontSize: 13,
    fontWeight: '700',
  },
  btnDeleteAction: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDeleteTxt: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyStateBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...SHADOWS.sh,
    marginBottom: 16,
  },
  emptyStateIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.g1,
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
});

export default RoomDetailScreen;
