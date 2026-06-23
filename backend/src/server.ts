import app from './app';
import { PORT } from './common/config/environment';
import { connectDatabase } from './common/config/database';
import { logger } from './common/utils/logger';
import UserModel from '@modules/auth/auth.model';
import LodgeModel from '@modules/lodge/lodge.model';
import UtilityPriceModel from '@modules/utilityPrice/utilityPrice.model';
import bcrypt from 'bcrypt';

const seedDefaultData = async (): Promise<void> => {
  try {
    const existingUser = await UserModel.findOne({ phone: '0912345678' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const user = await UserModel.create({
        name: 'Hệ thống (Fix)',
        phone: '0912345678',
        email: 'lean1835.vac@gmail.com',
        password: hashedPassword,
      });

      const lodge = await LodgeModel.create({
        name: 'Nhà trọ Mẫu',
        address: 'Số 1 Đại Cồ Việt, Hà Nội',
        phone: '0912345678',
        owner: user._id,
      });

      const utilityPrice = await UtilityPriceModel.create({
        elec: 3500.0,
        water: 15000.0,
        wifi: 100000.0,
        garbage: 20000.0,
        waterMode: 'meter',
        waterFixed: 150000.0,
        lodge: lodge._id,
      });

      lodge.utilityPrice = utilityPrice._id;
      await lodge.save();

      user.lodge = lodge._id;
      await user.save();

      logger.info('✅ Seeder: Default user created successfully: SĐT: 0912345678 / MK: 123456 / Email: lean1835.vac@gmail.com');
    } else {
      if (existingUser.email !== 'lean1835.vac@gmail.com') {
        existingUser.email = 'lean1835.vac@gmail.com';
        await existingUser.save();
        logger.info('✅ Seeder: Default user email updated to lean1835.vac@gmail.com');
      } else {
        logger.info('ℹ️ Seeder: Default user already exists and email is up to date.');
      }
    }
  } catch (error) {
    logger.error('❌ Seeder: Failed to seed default user data', error);
  }
};

const bootstrap = async (): Promise<void> => {
  // 1. Connect to Database
  await connectDatabase();

  // 2. Seed Default Data
  await seedDefaultData();

  // 3. Start HTTP Server
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    logger.info(`🔗 Health check available at http://localhost:${PORT}/health`);
  });
};

bootstrap().catch((err) => {
  logger.error('💥 Server bootstrap failed:', err);
  process.exit(1);
});
