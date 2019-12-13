const express = require("express");

const rpcRouter = require("./routes/rpc");
var cors = require("cors");

// Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static("public", {dotfiles: "allow"}));
//CORS
app.use(cors());

// Routes
app.use(rpcRouter);

module.exports = app;
