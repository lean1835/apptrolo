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
const RoomSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    status: {
        type: String,
        enum: ['empty', 'occupied', 'debt', 'maintenance'],
        default: 'empty',
    },
    tenant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenants' },
    checkin: { type: String, default: '' }, // YYYY-MM-DD
    people: { type: Number, default: 0 },
    ep: { type: Number, default: 0.0 },
    wp: { type: Number, default: 0.0 },
    descText: { type: String, default: '', trim: true },
    contract: {
        type: String,
        enum: ['monthly', 'quarter', 'halfyear'],
        default: 'monthly',
    },
    contractMonths: { type: Number, default: 0 },
    contractPrepaid: { type: Number, default: 0 },
    lodge: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lodges', required: true },
    debtAmount: { type: Number, default: 0 },
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            if (ret.tenant && typeof ret.tenant === 'object') {
                ret.phone = ret.tenant.phone || '';
                ret.tenantId = ret.tenant._id;
                ret.tenant = ret.tenant.name || '';
            }
            else if (ret.tenant) {
                ret.tenantId = ret.tenant;
                ret.tenant = '';
                ret.phone = '';
            }
            else {
                ret.tenant = '';
                ret.phone = '';
                ret.tenantId = null;
            }
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: (doc, ret) => {
            if (ret.tenant && typeof ret.tenant === 'object') {
                ret.phone = ret.tenant.phone || '';
                ret.tenantId = ret.tenant._id;
                ret.tenant = ret.tenant.name || '';
            }
            else if (ret.tenant) {
                ret.tenantId = ret.tenant;
                ret.tenant = '';
                ret.phone = '';
            }
            else {
                ret.tenant = '';
                ret.phone = '';
                ret.tenantId = null;
            }
            return ret;
        }
    },
});
// Virtual fields for relations (similar to JPA OneToMany)
RoomSchema.virtual('members', {
    ref: 'Members',
    localField: '_id',
    foreignField: 'room',
});
RoomSchema.virtual('meterReadings', {
    ref: 'MeterReadings',
    localField: '_id',
    foreignField: 'room',
});
RoomSchema.virtual('bills', {
    ref: 'Bills',
    localField: '_id',
    foreignField: 'room',
});
RoomSchema.index({ lodge: 1 }, { name: 'idx_room_lodge', background: true });
exports.default = mongoose_1.default.model('Rooms', RoomSchema);
