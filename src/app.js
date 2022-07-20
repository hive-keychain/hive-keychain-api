const express = require("express");

const rpcRouter = require("./routes/rpc");
const delegationRouter = require("./routes/delegation");
const witnessRouter = require("./routes/witness");
const priceRouter = require("./routes/price");
const badActorsRouter = require("./routes/badActors");
const versionLogRouter = require("./routes/version-log");
var cors = require("cors");

// Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public", { dotfiles: "allow" }));
//CORS
app.use(cors());

// Routes
app.use(rpcRouter);
app.use("/hive", witnessRouter);
app.use("/hive", delegationRouter);
app.use("/hive", priceRouter);
app.use("/hive", badActorsRouter);
app.use("/hive", versionLogRouter)

module.exports = app;
