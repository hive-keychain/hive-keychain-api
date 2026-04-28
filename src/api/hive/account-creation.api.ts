import { Express } from "express";
import { HiveAccountCreationLogic } from "../../logic/hive/account-creation.logic";

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

const setupApis = (app: Express) => {
  setupPostQuoteApi(app);
  setupGetStatusApi(app);
};

export const AccountCreationApi = {
  setupApis,
};
