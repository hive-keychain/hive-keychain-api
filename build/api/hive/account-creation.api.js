"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountCreationApi = void 0;
const account_creation_admin_logic_1 = require("../../logic/hive/account-creation-admin.logic");
const account_creation_logic_1 = require("../../logic/hive/account-creation.logic");
const access_middleware_1 = require("../../middleware/access.middleware");
const getStatusCode = (error) => error?.statusCode ?? 500;
const getErrorMessage = (error) => error?.message ?? "Unable to process account creation request.";
const setupPostQuoteApi = (app) => {
    app.post("/hive/account-creation/quote", async (req, res) => {
        try {
            res.status(201).send(await account_creation_logic_1.HiveAccountCreationLogic.createQuote(req.body));
        }
        catch (error) {
            res.status(getStatusCode(error)).send({ error: getErrorMessage(error) });
        }
    });
};
const setupGetStatusApi = (app) => {
    app.get("/hive/account-creation/:requestId", async (req, res) => {
        try {
            const request = await account_creation_logic_1.HiveAccountCreationLogic.getStatus(req.params.requestId);
            if (!request)
                return res.status(404).send({ error: "Request not found." });
            return res.status(200).send(request);
        }
        catch (error) {
            return res
                .status(getStatusCode(error))
                .send({ error: getErrorMessage(error) });
        }
    });
};
const setupPostPaymentTxApi = (app) => {
    app.post("/hive/account-creation/:requestId/payment-tx", async (req, res) => {
        try {
            const request = await account_creation_logic_1.HiveAccountCreationLogic.submitPaymentTx(req.params.requestId, req.body);
            if (!request)
                return res.status(404).send({ error: "Request not found." });
            return res.status(200).send(request);
        }
        catch (error) {
            return res
                .status(getStatusCode(error))
                .send({ error: getErrorMessage(error) });
        }
    });
};
const setupAdminApis = (app) => {
    app.get("/hive/account-creation/admin/request/:requestId", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), async (req, res) => {
        try {
            const request = await account_creation_admin_logic_1.HiveAccountCreationAdminLogic.getByRequestId(req.params.requestId);
            if (!request)
                return res.status(404).send({ error: "Request not found." });
            return res.status(200).send(request);
        }
        catch (error) {
            return res
                .status(getStatusCode(error))
                .send({ error: getErrorMessage(error) });
        }
    });
    app.get("/hive/account-creation/admin/username/:username", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), async (req, res) => {
        try {
            return res
                .status(200)
                .send(await account_creation_admin_logic_1.HiveAccountCreationAdminLogic.getByUsername(req.params.username));
        }
        catch (error) {
            return res
                .status(getStatusCode(error))
                .send({ error: getErrorMessage(error) });
        }
    });
    app.get("/hive/account-creation/admin/payment/:paymentTxId", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), async (req, res) => {
        try {
            const request = await account_creation_admin_logic_1.HiveAccountCreationAdminLogic.getByPaymentTxId(req.params.paymentTxId);
            if (!request)
                return res.status(404).send({ error: "Request not found." });
            return res.status(200).send(request);
        }
        catch (error) {
            return res
                .status(getStatusCode(error))
                .send({ error: getErrorMessage(error) });
        }
    });
    app.post("/hive/account-creation/admin/request/:requestId/retry", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), async (req, res) => {
        try {
            const result = await account_creation_admin_logic_1.HiveAccountCreationAdminLogic.retryFailedAccountCreation(req.params.requestId);
            if (!result)
                return res.status(404).send({ error: "Request not found." });
            return res.status(200).send(result);
        }
        catch (error) {
            return res
                .status(getStatusCode(error))
                .send({ error: getErrorMessage(error) });
        }
    });
    app.post("/hive/account-creation/admin/request/:requestId/cancel", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), async (req, res) => {
        try {
            const request = await account_creation_admin_logic_1.HiveAccountCreationAdminLogic.cancelRequest(req.params.requestId);
            if (!request)
                return res.status(404).send({ error: "Request not found." });
            return res.status(200).send(request);
        }
        catch (error) {
            return res
                .status(getStatusCode(error))
                .send({ error: getErrorMessage(error) });
        }
    });
};
const setupApis = (app) => {
    setupPostQuoteApi(app);
    setupPostPaymentTxApi(app);
    setupAdminApis(app);
    setupGetStatusApi(app);
};
exports.AccountCreationApi = {
    setupApis,
};
//# sourceMappingURL=account-creation.api.js.map