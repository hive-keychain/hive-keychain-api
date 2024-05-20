import { Express } from "express";
import { VersionLogLogic, VersionType } from "../logic/version-log.logic";
import { Role, accessCheck } from "../middleware/access.middleware";

const setupGetLastExtensionVersion = (app: Express) => {
  const getLastExtensionVersion = async (req, res) => {
    res.send(VersionLogLogic.getLastExtensionVersion(VersionType.EXTENSION));
  };
  app.get("/hive/last-extension-version", getLastExtensionVersion);
  app.get("/last-extension-version", getLastExtensionVersion);
};

const setupSetLastExtensionVersion = (app: Express) => {
  const setLastExtensionVersion = async (req, res) => {
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
  };
  app.post(
    "/hive/set-last-extension-version",
    accessCheck(Role.ADMIN),
    setLastExtensionVersion
  );
  app.post(
    "/set-last-extension-version",
    accessCheck(Role.ADMIN),
    setLastExtensionVersion
  );
};

const setupGetLastMobileVersion = (app: Express) => {
  const getLastExtensionVersionMobile = async (req, res) => {
    res.send(VersionLogLogic.getLastExtensionVersion(VersionType.MOBILE));
  };
  app.get("/hive/last-version-mobile", getLastExtensionVersionMobile);
  app.get("/last-version-mobile", getLastExtensionVersionMobile);
};

const setupSetLastMobileVersion = (app: Express) => {
  const setLastMobileVersion = async (req, res) => {
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
  };
  app.post(
    "/hive/set-last-version-mobile",
    accessCheck(Role.ADMIN),
    setLastMobileVersion
  );
  app.post(
    "/set-last-version-mobile",
    accessCheck(Role.ADMIN),
    setLastMobileVersion
  );
};

const setupApis = (app: Express) => {
  setupGetLastExtensionVersion(app);
  setupSetLastExtensionVersion(app);
  setupGetLastMobileVersion(app);
  setupSetLastMobileVersion(app);
};

export const VersionLogApi = {
  setupApis,
};
