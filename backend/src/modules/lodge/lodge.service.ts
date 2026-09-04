import LodgeModel from './lodge.model';
import { ILodge } from '@common/interfaces/lodge.interface';
import { ApiError } from '@common/utils/ApiError';

export class LodgeService {
  public async getLodgeByOwner(ownerId: string): Promise<any> {
    const lodge = await LodgeModel.findOne({ owner: ownerId }).populate('utilityPrice').lean();
    if (!lodge) {
      throw new ApiError(404, 'Không tìm thấy nhà trọ của bạn');
    }
    if (!lodge.bankAccount && lodge.bank) {
      lodge.bankAccount = lodge.bank;
    }
    return lodge;
  }

  public async updateLodge(ownerId: string, payload: any): Promise<ILodge> {
    const lodge = await LodgeModel.findOne({ owner: ownerId });
    if (!lodge) {
      throw new ApiError(404, 'Không tìm thấy nhà trọ để cập nhật');
    }

    if (payload.name !== undefined) lodge.name = payload.name;
    if (payload.address !== undefined) lodge.address = payload.address;
    if (payload.phone !== undefined) lodge.phone = payload.phone;
    if (payload.bank !== undefined) lodge.bank = payload.bank;
    if (payload.bankAccount !== undefined) lodge.bankAccount = payload.bankAccount;
    else if (payload.bank !== undefined && !lodge.bankAccount) lodge.bankAccount = payload.bank;
    if (payload.bankName !== undefined) lodge.bankName = payload.bankName;
    if (payload.billingDate !== undefined) lodge.billingDate = Number(payload.billingDate);
    if (payload.earlyRecordDays !== undefined) lodge.earlyRecordDays = Number(payload.earlyRecordDays);

    await lodge.save();
    return lodge;
  }
}
