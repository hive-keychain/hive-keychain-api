import { Express } from "express";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { MobileSettingsLogic } from "../logic/mobile-settings.logic";
import { Role, accessCheck } from "../middleware/access.middleware";

const setupGetMobileSettings = (app: Express) => {
  app.get("/mobile-settings", async (req, res) => {
    const settings = await MobileSettingsLogic.getSettings();
    Logger.info(`Get mobile settings`);
    res.status(200).send(settings);
  });
};

const setupEditMobileSettings = (app: Express) => {
  app.post(
    "/mobile-settings/edit",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const newSettings = req.body;
      await MobileSettingsLogic.editSettings(newSettings);
      Logger.info(`Editing mobile settings`);
      res.status(200).send({ status: 200 });
    }
  );
};

const setupApis = (app: Express) => {
  setupGetMobileSettings(app);
  setupEditMobileSettings(app);
};

export const SettingsApi = { setupApis };
