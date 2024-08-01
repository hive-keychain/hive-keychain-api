import * as fs from "fs";
import path from "path";

const getSettings = () => {
  try {
    return fs.readFileSync(
      path.join(__dirname, `/../../json/settings/mobile.json`)
    );
  } catch (e) {
    return {};
  }
};

const editSettings = (json) => {
  try {
    fs.writeFile(
      path.join(__dirname, `/../../json/settings/mobile.json`),
      JSON.stringify(json),
      "utf8",
      () => console.log(`Mobile settings updated`)
    );
  } catch (err) {
    console.log(err);
  }
};

export const MobileSettingsLogic = {
  getSettings,
  editSettings,
};
