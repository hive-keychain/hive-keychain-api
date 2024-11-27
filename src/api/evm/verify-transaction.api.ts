import { Express } from "express";

const VerifyTransaction = (app: Express) => {
  app.get("/evm/verifyTransaction", async (req, res) => {
    const { domain, to, contract } = req.query;
    const mock = {
      domain: {
        isBlacklisted: true,
        popularity: "low",
        isTrusted: "implement on frontend.",
      },
      contract: {
        verifiedBy: [
          { name: "Coingecko", icon: "https://www.coingecko.com/favicon.ico" },
        ],
        isBlacklisted: true,
        proxy: {
          target: "0x4bd844F72A8edD323056130A86FC624D0dbcF5b0",
        },
        hasBeenUsedBefore: "check on frontend",
      },
      to: {
        isBlacklisted: true,
        isSpoofing:
          "check on frontend if similar to one of own addresses or whitelisted address",
        isWhitelisted: "check on frontend if it was whitelisted",
      },
    };
    res.status(200).send(mock);
  });
};
const setupApis = (app: Express) => {
  VerifyTransaction(app);
};

export const VerifyTransactionApi = { setupApis };
