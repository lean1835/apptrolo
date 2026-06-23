"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimRequest = void 0;
const trimInPlace = (obj) => {
    if (obj && typeof obj === 'object') {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].trim();
                }
                else if (typeof obj[key] === 'object') {
                    trimInPlace(obj[key]);
                }
            }
        }
    }
};
const trimRequest = (req, res, next) => {
    if (req.body)
        trimInPlace(req.body);
    if (req.query)
        trimInPlace(req.query);
    if (req.params)
        trimInPlace(req.params);
    next();
};
exports.trimRequest = trimRequest;
