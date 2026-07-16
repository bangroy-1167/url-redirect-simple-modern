"use strict";
/**
 * helpers/response.helper.ts
 *
 * Format respons API konsisten di seluruh aplikasi modernURL8.
 * Mengadopsi kontrak spesifikasi (`success`, `message`, `data`, `meta`, `errors`).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
exports.validationFail = validationFail;
function ok(data, message = 'Success', meta) {
    return meta ? { success: true, message, data, meta } : { success: true, message, data };
}
function fail(message, errors) {
    return errors ? { success: false, message, errors } : { success: false, message };
}
function validationFail(errors) {
    return { success: false, message: 'Validation error', errors };
}
//# sourceMappingURL=response.helper.js.map