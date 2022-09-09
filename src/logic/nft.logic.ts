import { Response } from "express";
import SSC from "sscjs";

let rpc = new SSC("https://api.hive-engine.com/rpc");

const getAllMine = async (symbol: string, username: string, req: Response) => {
  let items = [];
  const limit = 1000;
  let offset = 0;

  let lastItemsLength = 0;

  do {
    let newItems = await rpc.find(
      "nft",
      symbol,
      {
        account: username,
      },
      limit,
      offset
    );

    console.log(newItems);

    offset += limit - 1;

    console.log(`total length so far ${items.length}`);

    lastItemsLength = newItems.length;
    items = [...items, ...newItems];
  } while (lastItemsLength !== 0);

  return items;
};

export const NftLogic = {
  getAllMine,
};
