"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bill_controller_1 = require("./bill.controller");
const router = (0, express_1.Router)();
router.get('/', bill_controller_1.getBills);
router.put('/:id', bill_controller_1.updateBill);
exports.default = router;
