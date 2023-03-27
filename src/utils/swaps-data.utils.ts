import path from "path";

// load lib...
const JSONFileStorage = require("node-json-file-storage"); // adjust the require path, if not installed via npm/yarn

// create store...
const layer1 = path.join(
  process.env.BLOCK_INFO_FILE_PATH,
  "/storage-layer-1.json"
);
const layer2 = path.join(
  process.env.BLOCK_INFO_FILE_PATH,
  "/storage-layer-2.json"
);
const storageLayer1 = new JSONFileStorage(layer1);
const storageLayer2 = new JSONFileStorage(layer2);

const saveLayer1BlockInfo = (transactionIndex: number) => {
  storageLayer1.put({ id: "transactionIndex", transactionIndex });
};

const getLayer1BlockInfo = (): Promise<any> => {
  return storageLayer1.get("transactionIndex").transactionIndex;
};

const saveLayer2BlockInfo = (blockNumber: number) => {
  storageLayer2.put({ id: "blockNumber", blockNumber });
};

const getLayer2BlockInfo = (): Promise<number> => {
  return storageLayer2.get("blockNumber").blockNumber;
};

export const SwapsDataUtils = {
  saveLayer1BlockInfo,
  saveLayer2BlockInfo,
  getLayer1BlockInfo,
  getLayer2BlockInfo,
};
