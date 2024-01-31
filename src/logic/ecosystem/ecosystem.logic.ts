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

const saveNewDapp = (newDapp: any, chain: string) => {
  const jsonString = fs.readFileSync(
    path.join(__dirname, `${chain}-dapps.json`),
    "utf-8"
  );
  const dapps = JSON.parse(jsonString);
  const id = Math.max(...dapps.map((d) => d.id));
  dapps.push({ ...newDapp, id: id + 1 });
  fs.writeFileSync(
    path.join(__dirname, `${chain}-dapps.json`),
    JSON.stringify(dapps)
  );
};

const editDapp = (dapp: any, chain: string) => {
  const jsonString = fs.readFileSync(
    path.join(__dirname, `${chain}-dapps.json`),
    "utf-8"
  );
  const dapps = JSON.parse(jsonString).filter((d) => d.id !== dapp.id);
  dapps.push(dapp);
  try {
    fs.writeFileSync(
      path.join(__dirname, `${chain}-dapps.json`),
      JSON.stringify(dapps)
    );
  } catch (err) {
    console.log(err);
  }
};

export const EcosystemLogic = { getDappList, saveNewDapp, editDapp };
