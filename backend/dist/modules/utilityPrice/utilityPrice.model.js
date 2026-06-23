"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const UtilityPriceSchema = new mongoose_1.Schema({
    elec: { type: Number, default: 3500.0 },
    water: { type: Number, default: 15000.0 },
    wifi: { type: Number, default: 100000.0 },
    garbage: { type: Number, default: 20000.0 },
    waterMode: { type: String, enum: ['meter', 'fixed'], default: 'meter' },
    waterFixed: { type: Number, default: 150000.0 },
    lodge: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lodges', required: true, unique: true },
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
});
UtilityPriceSchema.index({ lodge: 1 }, { name: 'idx_utilityPrice_lodge', background: true });
exports.default = mongoose_1.default.model('UtilityPrices', UtilityPriceSchema);
