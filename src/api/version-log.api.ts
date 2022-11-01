import { Express } from "express";
import { VersionLogLogic } from "../logic/version-log.logic";

const setupGetLastExtensionVersion = (app: Express) => {
  app.get("/hive/last-extension-version", async (req, res) => {
    res.send(VersionLogLogic.getLastExtensionVersion());
  });
};

const setupSetLastExtensionVersion = (app: Express) => {
  app.put("/hive/set-last-extension-version", async (req, res) => {
    if (req.query["VERSION_PASSWORD"] !== process.env.VERSION_PASSWORD) {
      res.status(401).send("Unauthorized");
    } else {
      VersionLogLogic.setLastExtensionVersion(req.body);
      res.send("OK");
    }
  });
};

const setupGetLastExtensionVersionMobile = (app: Express) => {
  app.get("/hive/last-extension-version-mobile", async (req, res) => {
    res.send(VersionLogLogic.getLastExtensionVersion(true));
  });
};

const setupSetLastExtensionVersionMobile = (app: Express) => {
  app.put("/hive/set-last-extension-version-mobile", async (req, res) => {
    if (req.query["VERSION_PASSWORD"] !== process.env.VERSION_PASSWORD) {
      res.status(401).send("Unauthorized");
    } else {
      VersionLogLogic.setLastExtensionVersion(req.body, true);
      res.send("OK");
    }
  });
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
