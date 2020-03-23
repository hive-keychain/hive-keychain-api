const express = require("express");
const router = new express.Router();
const config = require("../config");

// RPC from env
router.get("/rpc", async (req, res) => {
  res.send({rpc: config.rpc});
});

router.get("hive/rpc", async (req, res) => {
  res.send({rpc: config.hive_rpc});
});

module.exports = router;
