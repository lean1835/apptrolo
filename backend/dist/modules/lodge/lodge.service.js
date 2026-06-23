"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LodgeService = void 0;
const lodge_model_1 = __importDefault(require("./lodge.model"));
const ApiError_1 = require("../../common/utils/ApiError");
class LodgeService {
    async getLodgeByOwner(ownerId) {
        const lodge = await lodge_model_1.default.findOne({ owner: ownerId }).populate('utilityPrice');
        if (!lodge) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy nhà trọ của bạn');
        }
        return lodge;
    }
    async updateLodge(ownerId, payload) {
        const lodge = await lodge_model_1.default.findOne({ owner: ownerId });
        if (!lodge) {
            throw new ApiError_1.ApiError(404, 'Không tìm thấy nhà trọ để cập nhật');
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
exports.LodgeService = LodgeService;
