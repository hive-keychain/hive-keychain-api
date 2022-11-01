import * as fs from "fs";

const getLastExtensionVersion = (mobile?: boolean) => {
  const filename = mobile ? "mobile.json" : "extension.json";
  return fs.readFileSync(__dirname + `/../../version/${filename}`);
};

const setLastExtensionVersion = (json, mobile?: boolean) => {
  try {
    const filename = mobile ? "mobile.json" : "extension.json";
    fs.writeFile(
      __dirname + `/../../version/${filename}`,
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
