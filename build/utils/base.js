"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseApi = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const get = async (url, options = {}) => {
    return await new Promise((resolve, reject) => {
        try {
            (0, node_fetch_1.default)(url, {
                method: "GET",
                headers: { "Content-Type": "application/json", ...options.headers },
            })
                .then((res) => {
                if (res && res.status === 200) {
                    return res.json();
                }
            })
                .then((res) => {
                resolve(res);
            })
                .catch((err) => {
                reject(err);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};
const post = async (url, body) => {
    return await new Promise((resolve, reject) => {
        try {
            (0, node_fetch_1.default)(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
                .then((res) => {
                if (res && res.status === 200) {
                    return res.json();
                }
            })
                .then((res) => {
                resolve(res);
            })
                .catch((err) => {
                reject(err);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};
exports.BaseApi = {
    get,
    post,
};
//# sourceMappingURL=base.js.map