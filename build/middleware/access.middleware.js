"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessCheck = void 0;
const dhive_1 = require("@hiveio/dhive");
const hive_utils_1 = require("../utils/hive.utils");
const ADMINS = ["cedricguillas", "stoodkev"];
const TEAM_MEMBERS = ["theghost.1980", "manuphotos"];
const USER_LIST_ROLE = {
    ["ADMIN" /* Role.ADMIN */]: ADMINS,
    ["TEAM" /* Role.TEAM */]: [...ADMINS, ...TEAM_MEMBERS],
};
const checkRole = async (userList, message) => {
    const { expirationDate, encoded } = JSON.parse(atob(message));
    if (Number(expirationDate) < Date.now()) {
        console.log("Token has expired. Login again");
        throw { message: "Token has expired. Login again", statusCode: 440 };
    }
    const accounts = await hive_utils_1.HiveUtils.getClient().database.getAccounts(userList);
    for (const account of accounts) {
        const signature = dhive_1.Signature.fromString(encoded);
        const key = dhive_1.PublicKey.fromString(account.posting.key_auths[0][0]);
        const result = key.verify(dhive_1.cryptoUtils.sha256(expirationDate.toString()), signature);
        if (result)
            return true;
    }
    throw { message: "Not authorized", statusCode: 403 };
};
const accessCheck = (roleRequired) => {
    return async (req, res, next) => {
        let accessGranted = false;
        try {
            if (roleRequired === "NONE" /* Role.NONE */)
                accessGranted = true;
            else {
                accessGranted = await checkRole(USER_LIST_ROLE[roleRequired], req.headers.message);
            }
            next();
        }
        catch (err) {
            res
                .status(err.statusCode)
                .send({ error: { message: err.message, code: err.statusCode } });
        }
    };
};
exports.accessCheck = accessCheck;
//# sourceMappingURL=access.middleware.js.map