"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilityPriceService = void 0;
const utilityPrice_model_1 = __importDefault(require("./utilityPrice.model"));
const ApiError_1 = require("../../common/utils/ApiError");
class UtilityPriceService {
    async getUtilityPriceByLodge(lodgeId) {
        const utilityPrice = await utilityPrice_model_1.default.findOne({ lodge: lodgeId });
        if (!utilityPrice) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy cấu hình bảng giá điện nước');
        }
        return utilityPrice;
    }
    async updateUtilityPrice(lodgeId, payload) {
        const utilityPrice = await utilityPrice_model_1.default.findOne({ lodge: lodgeId });
        if (!utilityPrice) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy cấu hình bảng giá điện nước để cập nhật');
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
exports.UtilityPriceService = UtilityPriceService;
