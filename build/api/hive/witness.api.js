"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WitnessApi = void 0;
const express_validator_1 = require("express-validator");
const witness_logic_1 = require("../../logic/hive/witness.logic");
const setupGetWitnessApi = (app) => {
    app.get("/hive/witness/:username", (0, express_validator_1.query)("username").isString().not().isEmpty().escape(), async function (req, res) {
        res.status(200).send(await witness_logic_1.WitnessLogic.getWitness(req.params?.username));
    });
};
const setupGetWitnessesRankApi = (app) => {
    // Get witness ranking. This request doesn't include inactive witnesses
    // No parameter!
    app.get("/hive/witnesses-ranks", async function (req, res) {
        res.status(200).send(await witness_logic_1.WitnessLogic.getWitnessesRank());
    });
};
const setupGetWitnessRankV2Api = (app) => {
    app.get("/hive/v2/witnesses-ranks", async function (req, res) {
        try {
            const resp = await witness_logic_1.WitnessLogic.getWitnessesRankV2();
            res.status(200).send(resp);
        }
        catch (e) {
            console.log({ e });
            res.status(500).send(e);
        }
    });
};
const setupApis = (app) => {
    setupGetWitnessApi(app);
    setupGetWitnessRankV2Api(app);
    setupGetWitnessesRankApi(app);
};
exports.WitnessApi = { setupApis };
//# sourceMappingURL=witness.api.js.map