"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_controller_1 = require("./data.controller");
const router = (0, express_1.Router)();
router.get('/export', data_controller_1.exportData);
router.post('/import', data_controller_1.importData);
exports.default = router;
