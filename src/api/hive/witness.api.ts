import { Express } from "express";
import { WitnessLogic } from "../../logic/hive/witness.logic";

const setupGetWitnessApi = (app: Express) => {
  app.get("/hive/witness/:username", async function (req, res) {
    res.status(200).send(await WitnessLogic.getWitness(req.params.username));
  });
};
const setupGetWitnessesRankApi = (app: Express) => {
  // Get witness ranking. This request doesn't include inactive witnesses
  // No parameter!
  app.get("/hive/witnesses-ranks", async function (req, res) {
    res.status(200).send(await WitnessLogic.getWitnessesRank());
  });
};
const setupGetWitnessRankV2Api = (app: Express) => {
  app.get("/hive/v2/witnesses-ranks", async function (req, res) {
    try {
      const resp = await WitnessLogic.getWitnessesRankV2();
      res.status(200).send(resp);
    } catch (e) {
      console.log({ e });
      res.status(500).send(e);
    }
  });
};

const setupApis = (app: Express) => {
  setupGetWitnessApi(app);
  setupGetWitnessRankV2Api(app);
  setupGetWitnessesRankApi(app);
};

export const WitnessApi = { setupApis };
