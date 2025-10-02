import { BaseApi } from "./base";

const get = (url: string) => {
  return BaseApi.get(`https://deep-index.moralis.io/api/v2.2/${url}`, {
    headers: {
      "X-API-KEY": process.env.MORALIS_API_KEY || "",
    },
  });
};

export const MoralisApi = {
  get,
};
