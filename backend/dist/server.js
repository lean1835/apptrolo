"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const environment_1 = require("./common/config/environment");
const database_1 = require("./common/config/database");
const logger_1 = require("./common/utils/logger");
const auth_model_1 = __importDefault(require("./modules/auth/auth.model"));
const lodge_model_1 = __importDefault(require("./modules/lodge/lodge.model"));
const utilityPrice_model_1 = __importDefault(require("./modules/utilityPrice/utilityPrice.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const seedDefaultData = async () => {
    try {
        const existingUser = await auth_model_1.default.findOne({ phone: '0912345678' });
        if (!existingUser) {
            const hashedPassword = await bcrypt_1.default.hash('123456', 10);
            const user = await auth_model_1.default.create({
                name: 'Hệ thống (Fix)',
                phone: '0912345678',
                email: 'lean1835.vac@gmail.com',
                password: hashedPassword,
            });
            const lodge = await lodge_model_1.default.create({
                name: 'Nhà trọ Mẫu',
                address: 'Số 1 Đại Cồ Việt, Hà Nội',
                phone: '0912345678',
                owner: user._id,
            });
            const utilityPrice = await utilityPrice_model_1.default.create({
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
            logger_1.logger.info('✅ Seeder: Default user created successfully: SĐT: 0912345678 / MK: 123456 / Email: lean1835.vac@gmail.com');
        }
        else {
            if (existingUser.email !== 'lean1835.vac@gmail.com') {
                existingUser.email = 'lean1835.vac@gmail.com';
                await existingUser.save();
                logger_1.logger.info('✅ Seeder: Default user email updated to lean1835.vac@gmail.com');
            }
            else {
                logger_1.logger.info('ℹ️ Seeder: Default user already exists and email is up to date.');
            }
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Seeder: Failed to seed default user data', error);
    }
};
const bootstrap = async () => {
    // 1. Connect to Database
    await (0, database_1.connectDatabase)();
    // 2. Seed Default Data
    await seedDefaultData();
    // 3. Start HTTP Server
    app_1.default.listen(environment_1.PORT, '0.0.0.0', () => {
        logger_1.logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${environment_1.PORT}`);
        logger_1.logger.info(`🔗 Health check available at http://localhost:${environment_1.PORT}/health`);
    });
};
bootstrap().catch((err) => {
    logger_1.logger.error('💥 Server bootstrap failed:', err);
    process.exit(1);
});
