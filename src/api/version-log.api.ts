import { Express } from "express";
import { VersionLogLogic, VersionType } from "../logic/version-log.logic";
import { Role, accessCheck } from "../middleware/access.middleware";

const setupGetLastExtensionVersion = (app: Express) => {
  app.get("/hive/last-extension-version", async (req, res) => {
    res.send(VersionLogLogic.getLastExtensionVersion(VersionType.EXTENSION));
  });
};

const setupSetLastExtensionVersion = (app: Express) => {
  app.post(
    "/hive/set-last-extension-version",
    accessCheck(Role.ADMIN),
    async (req, res) => {
      try {
        await VersionLogLogic.setLastExtensionVersion(
          req.body,
          VersionType.EXTENSION
        );
        res.send({ status: 200, message: `Success` });
      } catch (err) {
        res.send({
          status: 500,
          message: `Error while saving: ${err.message}`,
        });
      }
    }
  );
};

const setupGetLastExtensionVersionMobile = (app: Express) => {
  app.get("/hive/last-version-mobile", async (req, res) => {
    res.send(VersionLogLogic.getLastExtensionVersion(VersionType.MOBILE));
  });
};

const setupSetLastExtensionVersionMobile = (app: Express) => {
  app.post(
    "/hive/set-last-version-mobile",
    accessCheck(Role.ADMIN),
    async (req, res) => {
      try {
        await VersionLogLogic.setLastExtensionVersion(
          req.body,
          VersionType.MOBILE
        );
        res.send({ status: 200, message: `Success` });
      } catch (err) {
        res.send({
          status: 500,
          message: `Error while saving: ${err.message}`,
        });
      }
      res.send("OK");
    }
  );
};

const setupApis = (app: Express) => {
  setupGetLastExtensionVersion(app);
  setupSetLastExtensionVersion(app);
  setupGetLastExtensionVersionMobile(app);
  setupSetLastExtensionVersionMobile(app);
};

export const VersionLogApi = {
  setupApis,
};
