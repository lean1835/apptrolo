import ActivityModel from './activity.model';
import LodgeModel from '@modules/lodge/lodge.model';
import { IActivity } from '@common/interfaces/activity.interface';
import { logger } from '@common/utils/logger';

export class ActivityService {
  public async logActivity(userId: string, txt: string, type: string): Promise<IActivity | null> {
    try {
      logger.info(`[LogActivity] User: ${userId}, Text: "${txt}", Type: ${type}`);
      const activity = await ActivityModel.create({
        txt,
        type,
        user: userId,
      });
      return activity;
    } catch (error) {
      logger.error('❌ Failed to log activity:', error);
      return null;
    }
  }

  public async logActivityByLodge(lodgeId: string, txt: string, type: string): Promise<IActivity | null> {
    try {
      const lodge = await LodgeModel.findById(lodgeId);
      if (lodge && lodge.owner) {
        return await this.logActivity(lodge.owner.toString(), txt, type);
      }
      logger.warn(`[LogActivityByLodge] Lodge or owner not found for lodgeId: ${lodgeId}`);
      return null;
    } catch (error) {
      logger.error('❌ Failed to log activity by lodge:', error);
      return null;
    }
  }
}
