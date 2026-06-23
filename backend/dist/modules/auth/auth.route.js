"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const authen_middleware_1 = require("../../common/middlewares/authen.middleware");
const auth_validation_1 = require("./auth.validation");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (0, validate_middleware_1.validate)(auth_validation_1.registerSchema), auth_controller_1.register);
router.post('/authenticate', (0, validate_middleware_1.validate)(auth_validation_1.loginSchema), auth_controller_1.authenticate);
// Protected routes (require authenticationMiddleware)
router.get('/me', authen_middleware_1.authenticationMiddleware, auth_controller_1.getMe);
router.post('/update', authen_middleware_1.authenticationMiddleware, (0, validate_middleware_1.validate)(auth_validation_1.updateProfileSchema), auth_controller_1.updateProfile);
router.post('/change-password', authen_middleware_1.authenticationMiddleware, (0, validate_middleware_1.validate)(auth_validation_1.changePasswordSchema), auth_controller_1.changePassword);
exports.default = router;
