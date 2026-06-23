"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_EXPIRATION = exports.JWT_SECRET = exports.MONGODB_URI = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../.env') });
exports.PORT = parseInt(process.env.PORT || '8080', 10);
exports.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apptrololo';
exports.JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
exports.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '86400000';
