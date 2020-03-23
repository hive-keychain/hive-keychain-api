const express = require("express");
const router = new express.Router();
const delegations = require("../controllers/delegation");

router.get("/delegators/:username", async function(req, res) {
  res.status(200).send(await delegations.getIncoming(req.params.username));
});

module.exports = router;
