import { Express } from "express";
import { TokensBackgroundColorsLogic } from "../../logic/hive/token-background-color";

const setupGetBackgroundColor = (app: Express) => {
  app.get("/hive/tokensBackgroundColors", async (req, res) => {
    const tokenBackgroundColors =
      await TokensBackgroundColorsLogic.getColorMap();
    res.status(200).send(tokenBackgroundColors);
  });
};

const setupApis = (app: Express) => {
  setupGetBackgroundColor(app);
};

export const TokensBackgroundColorsApi = { setupApis };
