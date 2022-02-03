const express = require("express");
const router = new express.Router();
const price = require("../controllers/price");

router.get("/v2/price", async function (req, res) {
  res.status(200).send(await price.getValues());
});

module.exports = router;
