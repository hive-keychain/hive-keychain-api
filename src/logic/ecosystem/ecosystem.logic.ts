import fs from "fs";
import path from "path";
import { ArrayUtils } from "../../utils/array.utils";

const getDappList = (chain: string) => {
  const jsonString = fs.readFileSync(
    path.join(__dirname, `${chain}-dapps.json`),
    "utf-8"
  );
  const dapps = JSON.parse(jsonString);
  let categories = [];
  for (const item of dapps) {
    categories = ArrayUtils.mergeWithoutDuplicate(item.categories, categories);
  }

  const ecosystem = [];

  for (const cat of categories) {
    ecosystem.push({
      category: cat,
      dapps: dapps.filter((dapp) => dapp.categories.includes(cat)),
    });
  }

  return ecosystem;
};

export const EcosystemLogic = { getDappList };
