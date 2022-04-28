const express = require("express");
const router = new express.Router();
const delegations = require("../controllers/delegation");

router.get("/delegators/:username", async function (req, res) {
  try {
    const resp = await delegations.getIncoming(req.params.username);
    res.status(200).send(resp);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
