import LodgeModel from './lodge.model';
import { ILodge } from '@common/interfaces/lodge.interface';
import { ApiError } from '@common/utils/ApiError';

export class LodgeService {
  public async getLodgeByOwner(ownerId: string): Promise<ILodge> {
    const lodge = await LodgeModel.findOne({ owner: ownerId }).populate('utilityPrice');
    if (!lodge) {
      throw new ApiError(404, 'Không tìm thấy nhà trọ của bạn');
    }
    return lodge;
  }

  public async updateLodge(ownerId: string, payload: any): Promise<ILodge> {
    const lodge = await LodgeModel.findOne({ owner: ownerId });
    if (!lodge) {
      throw new ApiError(404, 'Không tìm thấy nhà trọ để cập nhật');
    }

    lodge.name = payload.name;
    lodge.address = payload.address || '';
    lodge.phone = payload.phone;
    lodge.bank = payload.bank || '';
    lodge.bankName = payload.bankName || '';

    await lodge.save();
    return lodge;
  }
}
