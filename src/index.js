require("dotenv").config();
const https = require("https");
const http = require("http");
const fs = require("fs");
const app = require("./app");
const port = process.env.PORT || 3000;

// Listenings

if (!process.env.DEV) {
  https
    .createServer(
      {
        key: fs.readFileSync(
          "/etc/letsencrypt/live/api.hive-keychain.com/privkey.pem",
          "utf8"
        ),
        cert: fs.readFileSync(
          "/etc/letsencrypt/live/api.hive-keychain.com/cert.pem",
          "utf8"
        ),
        ca: fs.readFileSync(
          "/etc/letsencrypt/live/api.hive-keychain.com/chain.pem",
          "utf8"
        )
      },
      app
    )
    .listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
} else {
  http.createServer(app).listen(port);
}
