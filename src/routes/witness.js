const express = require("express");
const router = new express.Router();
const witnesses = require("../controllers/witness");

router.get("/witness/:username", async function (req, res) {
  res.status(200).send(await witnesses.getWitness(req.params.username));
});

// Get witness ranking. This request doesn't include inactive witnesses
// No parameter!
router.get("/witnesses-ranks", async function (req, res) {
  res.status(200).send(await witnesses.getWitnessesRank());
});

router.get("/v2/witnesses-ranks", async function (req, res) {
  res.status(200).send(await witnesses.getWitnessesRankV2());
});

module.exports = router;
