import UtilityPriceModel from './utilityPrice.model';
import { IUtilityPrice } from '@common/interfaces/utilityPrice.interface';
import { ApiError } from '@common/utils/ApiError';

export class UtilityPriceService {
  public async getUtilityPriceByLodge(lodgeId: string): Promise<any> {
    const utilityPrice = await UtilityPriceModel.findOne({ lodge: lodgeId }).lean();
    if (!utilityPrice) {
      throw new ApiError(404, 'Không tìm thấy cấu hình bảng giá điện nước');
    }
    return utilityPrice;
  }

  public async updateUtilityPrice(lodgeId: string, payload: any): Promise<IUtilityPrice> {
    const utilityPrice = await UtilityPriceModel.findOne({ lodge: lodgeId });
    if (!utilityPrice) {
      throw new ApiError(404, 'Không tìm thấy cấu hình bảng giá điện nước để cập nhật');
    }

    utilityPrice.elec = payload.elec;
    utilityPrice.water = payload.water;
    utilityPrice.wifi = payload.wifi;
    utilityPrice.garbage = payload.garbage;
    utilityPrice.waterMode = payload.waterMode;
    utilityPrice.waterFixed = payload.waterFixed;

    await utilityPrice.save();
    return utilityPrice;
  }
}
