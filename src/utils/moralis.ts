import { BaseApi } from "./base";

const get = (url: string) => {
  console.log(`https://deep-index.moralis.io/api/v2.2/${url}`);
  return BaseApi.get(`https://deep-index.moralis.io/api/v2.2/${url}`, {
    headers: {
      "X-API-KEY": process.env.MORALIS_API_KEY || "",
    },
  });
};

export const MoralisApi = {
  get,
};
