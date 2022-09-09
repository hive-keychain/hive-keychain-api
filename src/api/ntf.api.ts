import { Express } from "express";
import { NftLogic } from "../logic/nft.logic";

const setupGetMyNFT = (app: Express) => {
  app.get("/hive/nfts/:symbol/getAll/:username", async (req, res) => {
    res.json(
      await NftLogic.getAllMine(req.params.symbol, req.params.username, res)
    );
  });
};

const setupApis = (app: Express) => {
  setupGetMyNFT(app);
};

export const NftApi = {
  setupApis,
};
