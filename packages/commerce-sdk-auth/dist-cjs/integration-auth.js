"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuthHeader = getOAuthHeader;
const tslib_1 = require("tslib");
const node_crypto_1 = tslib_1.__importDefault(require("node:crypto"));
const oauth_1_0a_1 = tslib_1.__importDefault(require("oauth-1.0a"));
function getOAuthHeader({ consumerKey, consumerSecret, }) {
    return new oauth_1_0a_1.default({
        consumer: {
            key: consumerKey,
            secret: consumerSecret,
        },
        signature_method: "HMAC-SHA256",
        hash_function: (baseString, key) => node_crypto_1.default.createHmac("sha256", key).update(baseString).digest("base64"),
    });
}
