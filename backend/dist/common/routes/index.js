"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authen_middleware_1 = require("../middlewares/authen.middleware");
const auth_route_1 = __importDefault(require("../../modules/auth/auth.route"));
const lodge_route_1 = __importDefault(require("../../modules/lodge/lodge.route"));
const utilityPrice_route_1 = __importDefault(require("../../modules/utilityPrice/utilityPrice.route"));
const room_route_1 = __importDefault(require("../../modules/room/room.route"));
const bill_route_1 = __importDefault(require("../../modules/bill/bill.route"));
const activity_route_1 = __importDefault(require("../../modules/activity/activity.route"));
const data_route_1 = __importDefault(require("../../modules/data/data.route"));
const router = (0, express_1.Router)();
// Register routes
router.use('/auth', auth_route_1.default);
router.use('/lodge', authen_middleware_1.authenticationMiddleware, lodge_route_1.default);
router.use('/utility-prices', authen_middleware_1.authenticationMiddleware, utilityPrice_route_1.default);
router.use('/rooms', authen_middleware_1.authenticationMiddleware, room_route_1.default);
router.use('/bills', authen_middleware_1.authenticationMiddleware, bill_route_1.default);
router.use('/activities', authen_middleware_1.authenticationMiddleware, activity_route_1.default);
router.use('/data', authen_middleware_1.authenticationMiddleware, data_route_1.default);
exports.default = router;
