import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
import { ArrayUtils } from "../../utils/array.utils";

interface dApp {
  id: number;
  chainId: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  mobileUrl: string;
  categories: string[];
  active: boolean;
  order: number;
  hideOniOS?: boolean;
}

const ECOSYSTEM_DAPPS_PATH = path.join(
  __dirname,
  "../../../ecosystem/dapps.json",
);

const readAllDapps = () => {
  const jsonString = fs.readFileSync(ECOSYSTEM_DAPPS_PATH, "utf-8");
  return JSON.parse(jsonString) as dApp[];
};

const writeAllDapps = (dapps: dApp[]) => {
  fs.writeFileSync(ECOSYSTEM_DAPPS_PATH, JSON.stringify(dapps, null, 2));
};

const getDappList = () => {
  try {
    const dapps = readAllDapps();
    let categories = [];
    for (const item of dapps) {
      categories = ArrayUtils.mergeWithoutDuplicate(
        item.categories,
        categories,
      );
    }

    const ecosystem = [];

    for (const cat of categories) {
      ecosystem.push({
        category: cat,
        dapps: getOrderedDapps(
          dapps.filter((dapp) => dapp.categories.includes(cat)),
        ),
      });
    }
    return ecosystem;
  } catch (err) {
    Logger.error(`Error while getting dapps list: ${err}`);
    return [];
  }
};

const getOrderedDapps = (dApps: dApp[]) => {
  const withReferral = dApps.filter((e) => e.url.includes("?ref=")),
    withoutReferral = dApps.filter((e) => !e.url.includes("?ref="));
  return [
    ...ArrayUtils.shuffle(withReferral),
    ...ArrayUtils.shuffle(withoutReferral),
  ];
};

const saveNewDapp = (newDapp: any) => {
  const dapps = readAllDapps();
  const id = dapps.length ? Math.max(...dapps.map((d) => d.id)) : -1;
  dapps.push({ ...newDapp, id: id + 1 });
  writeAllDapps(dapps);
};

const editDapp = (dapp: any) => {
  const dapps = readAllDapps().filter((d) => !(d.id === dapp.id));
  dapps.push(dapp);
  try {
    writeAllDapps(dapps);
  } catch (err) {
    console.log({ err });
  }
};

const deleteDapp = (dapp: any) => {
  const dapps = readAllDapps().filter((d) => !(d.id === dapp.id));
  try {
    writeAllDapps(dapps);
  } catch (err) {
    console.log(err);
  }
};

export const EcosystemLogic = {
  getDappList,
  saveNewDapp,
  editDapp,
  deleteDapp,
};
