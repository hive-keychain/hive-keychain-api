const express = require("express");
const router = new express.Router();
const bittrex = require("../controllers/bittrex");

router.get("/bittrex", async function(req, res) {
  res.status(200).send(await bittrex.getValues());
});

module.exports = router;
