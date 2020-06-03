const express = require("express");
const router = new express.Router();
const badActors = require("../controllers/badActors");

router.get("/phishingAccounts", async function(req, res) {
  const phishingAccounts = await badActors.getPhishingAccounts();
  console.log(`${phishingAccounts.length} potential phishing accounts listed.`);
  res.status(200).send(phishingAccounts);
});

module.exports = router;
