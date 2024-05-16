import * as fs from "fs";
import path from "path";

export enum VersionType {
  MOBILE = "mobile",
  EXTENSION = "extension",
}

const getLastExtensionVersion = (versionType: VersionType) => {
  return fs.readFileSync(
    path.join(__dirname, `/../../json/version/${versionType}.json`)
  );
};

const setLastExtensionVersion = (json, versionType: VersionType) => {
  try {
    fs.writeFile(
      path.join(__dirname, `/../../json/version/${versionType}.json`),
      JSON.stringify(json),
      "utf8",
      () => console.log(`Version updated to ${json.version}`)
    );
  } catch (err) {
    console.log(err);
  }
};

export const VersionLogLogic = {
  setLastExtensionVersion,
  getLastExtensionVersion,
};
