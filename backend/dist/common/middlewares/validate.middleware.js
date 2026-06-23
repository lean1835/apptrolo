"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const ApiError_1 = require("../utils/ApiError");
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errorMessage = error.details.map((details) => details.message).join(', ');
            return next(new ApiError_1.ApiError(400, errorMessage));
        }
        req.body = value;
        next();
    };
};
exports.validate = validate;
