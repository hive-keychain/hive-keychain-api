const express = require("express");
const router = new express.Router();

// RPC from env
router.get("/rpc", async (req, res) => {
  res.send({rpc: process.env.RPC});
});
router.get("hive/rpc", async (req, res) => {
  res.send({rpc: process.env.HIVE_RPC});
});

module.exports = router;
