const express = require("express");
const router = new express.Router();
const VersionLog = require("../controllers/version-log");


router.get("/last-extension-version", async (req, res) => {
  res.send(VersionLog.getLastExtensionVersion());
});
router.put("/set-last-extension-version", async (req, res) => {
    if(req.query['VERSION_PASSWORD'] !== process.env.VERSION_PASSWORD){
        res.status(401).send('Unauthorized');
    }
    else {
        VersionLog.setLastExtensionVersion(req.body)
        res.send('OK');
    }

  });


module.exports = router;
