import { Express } from "express";
import { HiveAccountCreationAdminLogic } from "../../logic/hive/account-creation-admin.logic";
import { HiveAccountCreationLogic } from "../../logic/hive/account-creation.logic";
import { Role, accessCheck } from "../../middleware/access.middleware";

const getStatusCode = (error: any) => error?.statusCode ?? 500;

const getErrorMessage = (error: any) =>
  error?.message ?? "Unable to process account creation request.";

const setupPostQuoteApi = (app: Express) => {
  app.post("/hive/account-creation/quote", async (req, res) => {
    try {
      res.status(201).send(await HiveAccountCreationLogic.createQuote(req.body));
    } catch (error) {
      res.status(getStatusCode(error)).send({ error: getErrorMessage(error) });
    }
  });
};

const setupGetStatusApi = (app: Express) => {
  app.get("/hive/account-creation/:requestId", async (req, res) => {
    try {
      const request = await HiveAccountCreationLogic.getStatus(
        req.params.requestId,
      );
      if (!request) return res.status(404).send({ error: "Request not found." });
      return res.status(200).send(request);
    } catch (error) {
      return res
        .status(getStatusCode(error))
        .send({ error: getErrorMessage(error) });
    }
  });
};

const setupPostPaymentTxApi = (app: Express) => {
  app.post("/hive/account-creation/:requestId/payment-tx", async (req, res) => {
    try {
      const request = await HiveAccountCreationLogic.submitPaymentTx(
        req.params.requestId,
        req.body,
      );
      if (!request) return res.status(404).send({ error: "Request not found." });
      return res.status(200).send(request);
    } catch (error) {
      return res
        .status(getStatusCode(error))
        .send({ error: getErrorMessage(error) });
    }
  });
};

const setupAdminApis = (app: Express) => {
  app.get(
    "/hive/account-creation/admin/request/:requestId",
    accessCheck(Role.ADMIN),
    async (req, res) => {
      try {
        const request = await HiveAccountCreationAdminLogic.getByRequestId(
          req.params.requestId,
        );
        if (!request) return res.status(404).send({ error: "Request not found." });
        return res.status(200).send(request);
      } catch (error) {
        return res
          .status(getStatusCode(error))
          .send({ error: getErrorMessage(error) });
      }
    },
  );

  app.get(
    "/hive/account-creation/admin/username/:username",
    accessCheck(Role.ADMIN),
    async (req, res) => {
      try {
        return res
          .status(200)
          .send(await HiveAccountCreationAdminLogic.getByUsername(req.params.username));
      } catch (error) {
        return res
          .status(getStatusCode(error))
          .send({ error: getErrorMessage(error) });
      }
    },
  );

  app.get(
    "/hive/account-creation/admin/payment/:paymentTxId",
    accessCheck(Role.ADMIN),
    async (req, res) => {
      try {
        const request = await HiveAccountCreationAdminLogic.getByPaymentTxId(
          req.params.paymentTxId,
        );
        if (!request) return res.status(404).send({ error: "Request not found." });
        return res.status(200).send(request);
      } catch (error) {
        return res
          .status(getStatusCode(error))
          .send({ error: getErrorMessage(error) });
      }
    },
  );

  app.post(
    "/hive/account-creation/admin/request/:requestId/retry",
    accessCheck(Role.ADMIN),
    async (req, res) => {
      try {
        const result = await HiveAccountCreationAdminLogic.retryFailedAccountCreation(
          req.params.requestId,
        );
        if (!result) return res.status(404).send({ error: "Request not found." });
        return res.status(200).send(result);
      } catch (error) {
        return res
          .status(getStatusCode(error))
          .send({ error: getErrorMessage(error) });
      }
    },
  );

  app.post(
    "/hive/account-creation/admin/request/:requestId/cancel",
    accessCheck(Role.ADMIN),
    async (req, res) => {
      try {
        const request = await HiveAccountCreationAdminLogic.cancelRequest(
          req.params.requestId,
        );
        if (!request) return res.status(404).send({ error: "Request not found." });
        return res.status(200).send(request);
      } catch (error) {
        return res
          .status(getStatusCode(error))
          .send({ error: getErrorMessage(error) });
      }
    },
  );
};

const setupApis = (app: Express) => {
  setupPostQuoteApi(app);
  setupPostPaymentTxApi(app);
  setupAdminApis(app);
  setupGetStatusApi(app);
};

export const AccountCreationApi = {
  setupApis,
};
