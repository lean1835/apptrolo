"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const logFormat = winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = isProduction ? 'info' : 'debug';
exports.logger = winston_1.default.createLogger({
    level: logLevel,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        // Console log (colored)
        new winston_1.default.transports.Console({
            level: logLevel,
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat)
        }),
        // Rotating error log file
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(__dirname, '../../../logs/error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d',
            format: winston_1.default.format.combine(winston_1.default.format.uncolorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat)
        }),
        // Rotating combined log file
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(__dirname, '../../../logs/combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            format: winston_1.default.format.combine(winston_1.default.format.uncolorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat)
        })
    ]
});
