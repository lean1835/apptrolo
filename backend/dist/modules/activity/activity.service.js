"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const activity_model_1 = __importDefault(require("./activity.model"));
const lodge_model_1 = __importDefault(require("../lodge/lodge.model"));
const logger_1 = require("../../common/utils/logger");
class ActivityService {
    async logActivity(userId, txt, type) {
        try {
            logger_1.logger.info(`[LogActivity] User: ${userId}, Text: "${txt}", Type: ${type}`);
            const activity = await activity_model_1.default.create({
                txt,
                type,
                user: userId,
            });
            return activity;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to log activity:', error);
            return null;
        }
    }
    async logActivityByLodge(lodgeId, txt, type) {
        try {
            const lodge = await lodge_model_1.default.findById(lodgeId);
            if (lodge && lodge.owner) {
                return await this.logActivity(lodge.owner.toString(), txt, type);
            }
            logger_1.logger.warn(`[LogActivityByLodge] Lodge or owner not found for lodgeId: ${lodgeId}`);
            return null;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to log activity by lodge:', error);
            return null;
        }
    }
}
exports.ActivityService = ActivityService;
