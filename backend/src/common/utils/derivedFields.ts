import { IBill, BillPaymentStatus } from '../interfaces/bill.interface';

/**
 * 1. Nhãn tháng: = tháng của ngày mở kỳ (periodStart hoặc date)
 * Ví dụ: '2026-09-01' -> 'Tháng 9/2026'
 */
export function getMonthLabel(dateOrPeriodStart?: string): string {
  if (!dateOrPeriodStart) return '';
  const parts = dateOrPeriodStart.split('-');
  if (parts.length >= 2) {
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[0], 10);
    return `Tháng ${month}/${year}`;
  }
  return dateOrPeriodStart;
}

/**
 * 2. Số còn thiếu: = total − amountPaid
 */
export function getUnpaidAmount(total: number, amountPaid: number): number {
  const diff = (total || 0) - (amountPaid || 0);
  return Math.max(0, diff);
}

/**
 * 3. Ba mức khóa: So amountPaid với total (0 / một phần / đủ)
 */
export function getPaymentLockState(total: number, amountPaid: number): BillPaymentStatus {
  const t = total || 0;
  const p = amountPaid || 0;
  if (p <= 0) return 'unpaid';
  if (p < t) return 'partial';
  return 'paid';
}

/**
 * 4. Badge ĐANG NỢ: Phòng có bill quá hạn (kỳ kết thúc < ngày hiện tại) chưa thu đủ
 */
export function isOverdueBill(bill: { periodEnd?: string; total?: number; amountPaid?: number; collected?: boolean }): boolean {
  if (!bill) return false;
  const total = bill.total || 0;
  const amountPaid = bill.amountPaid || 0;
  if (amountPaid >= total || bill.collected) {
    return false;
  }
  if (!bill.periodEnd) return false;

  const todayStr = new Date().toISOString().split('T')[0];
  return bill.periodEnd < todayStr;
}

export function hasOverdueDebt(bills: Array<{ periodEnd?: string; total?: number; amountPaid?: number; collected?: boolean }>): boolean {
  if (!bills || !Array.isArray(bills)) return false;
  return bills.some(b => isOverdueBill(b));
}

/**
 * 5. Ngăn Chưa chốt / Chờ thu / Nợ:
 * - 'unbilled': Phòng đang thuê nhưng chưa có hóa đơn cho kỳ hiện tại
 * - 'pending_payment': Đã có hóa đơn trong hạn nhưng chưa thu đủ
 * - 'debt': Có hóa đơn quá hạn chưa thu đủ
 */
export type RoomCategorySection = 'empty' | 'unbilled' | 'pending_payment' | 'debt';

export function categorizeRoomSection(params: {
  status: string; // 'empty' | 'occupied' | 'maintenance'
  hasActiveBill: boolean;
  isBillOverdue: boolean;
  isFullyPaid: boolean;
}): RoomCategorySection {
  if (params.status === 'empty' || params.status === 'maintenance') {
    return 'empty';
  }

  if (params.isBillOverdue && !params.isFullyPaid) {
    return 'debt';
  }

  if (!params.hasActiveBill) {
    return 'unbilled';
  }

  if (!params.isFullyPaid) {
    return 'pending_payment';
  }

  return 'unbilled'; // Đã thanh toán xong kỳ này, chờ kỳ tiếp theo
}
