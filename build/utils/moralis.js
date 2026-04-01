"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoralisApi = void 0;
const base_1 = require("./base");
const get = (url) => {
    // console.log(`https://deep-index.moralis.io/api/v2.2/${url}`);
    return base_1.BaseApi.get(`https://deep-index.moralis.io/api/v2.2/${url}`, {
        headers: {
            "X-API-KEY": process.env.MORALIS_API_KEY || "",
        },
    });
};
exports.MoralisApi = {
    get,
};
//# sourceMappingURL=moralis.js.map