"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensBackgroundColorsApi = void 0;
const token_background_color_1 = require("../../logic/hive/token-background-color");
const setupGetBackgroundColor = (app) => {
    app.get("/hive/tokensBackgroundColors", async (req, res) => {
        const tokenBackgroundColors = await token_background_color_1.TokensBackgroundColorsLogic.getColorMap();
        res.status(200).send(tokenBackgroundColors);
    });
};
const setupApis = (app) => {
    setupGetBackgroundColor(app);
};
exports.TokensBackgroundColorsApi = { setupApis };
//# sourceMappingURL=background-color.api.js.map