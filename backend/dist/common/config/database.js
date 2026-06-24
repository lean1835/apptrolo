"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = require("./environment");
const logger_1 = require("../utils/logger");
const dns_1 = __importDefault(require("dns"));
// Force public DNS resolution to bypass local SRV lookup refuse errors (ECONNREFUSED)
try {
    dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (err) {
    logger_1.logger.warn('Failed to set custom DNS servers', err);
}
const connectDatabase = async () => {
    try {
        await mongoose_1.default.connect(environment_1.MONGODB_URI);
        logger_1.logger.info('✅ Successfully connected to MongoDB database');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to connect to MongoDB', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
