import { HiveUtils } from "../../../utils/hive.utils";

const getMarket = async () => {
  const res = await HiveUtils.getClient().call(
    "condenser_api",
    "get_order_book"
  );
  console.log(res);
  return res;
};

export const InternalMarketLogic = {
  getMarket,
};
