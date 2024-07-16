import Logger from "hive-keychain-commons/lib/logger/logger";
import req from "request";
import { CoingeckoPlatform, CoingeckoToken } from "../logic/coingecko-config";

const fetchCoingeckoTokensConfig = (): Promise<CoingeckoToken[]> => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://api.coingecko.com/api/v3/coins/list?include_platform=true`,
        json: true,
      },
      (err, http, body) => {
        if (err) {
          fulfill(null);
        } else {
          if (body?.status?.error_code) fulfill(null);
          else fulfill(body);
        }
      }
    );
  });
};

const fetchCoingeckoPlatformsConfig = (): Promise<CoingeckoPlatform[]> => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://api.coingecko.com/api/v3/asset_platforms`,
        json: true,
      },
      (err, http, body) => {
        if (err) {
          fulfill(null);
        } else {
          if (body?.status?.error_code) fulfill(null);
          else fulfill(body);
        }
      }
    );
  });
};

interface CoingeckoCoinData {
  id: string;
  symbol: string;
  name: string;
  web_slug: string;
  asset_platform_id: null | number;
  platforms: { [key: string]: string };
  detail_platforms: {
    [key: string]: { decimal_place: null | number; contract_address: string };
  };
  block_time_in_minutes: number;
  hashing_algorithm: string;
  categories: Array<string>;
  preview_listing: boolean;
  public_notice: null | string;
  additional_notices: Array<string>;
  description: { en: string };
  links: {
    homepage: Array<string>;
    whitepaper: string;
    blockchain_site: Array<string>;
    official_forum_url: Array<string>;
    chat_url: Array<string>;
    announcement_url: Array<string>;
    twitter_screen_name: string;
    facebook_username: string;
    bitcointalk_thread_identifier: null | string;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: { github: Array<string>; bitbucket: Array<string> };
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  country_origin: string;
  genesis_date: string;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  ico_data: {
    ico_start_date: string;
    ico_end_date: string;
    short_desc: string;
    description: null | string;
    links: {};
    softcap_currency: string;
    hardcap_currency: string;
    total_raised_currency: string;
    softcap_amount: null | number;
    hardcap_amount: null | number;
    total_raised: null | number;
    quote_pre_sale_currency: string;
    base_pre_sale_amount: null | number;
    quote_pre_sale_amount: null | number;
    quote_public_sale_currency: string;
    base_public_sale_amount: number;
    quote_public_sale_amount: number;
    accepting_currencies: string;
    country_origin: string;
    pre_sale_start_date: null | string;
    pre_sale_end_date: null | string;
    whitelist_url: string;
    whitelist_start_date: null | string;
    whitelist_end_date: null | string;
    bounty_detail_url: string;
    amount_for_sale: null | number;
    kyc_required: boolean;
    whitelist_available: null | boolean;
    pre_sale_available: null | boolean;
    pre_sale_ended: boolean;
  };
  watchlist_portfolio_users: number;
  market_cap_rank: number;
  status_updates: Array<string>;
  last_updated: string;
}

const fetchCoingeckoCoinData = (id: string): Promise<CoingeckoCoinData> => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
        json: true,
      },
      (err, http, body) => {
        if (err) {
          fulfill(null);
        } else {
          if (body?.status?.error_code) {
            Logger.error(body.status.error_message);
            fulfill(null);
          } else fulfill(body);
        }
      }
    );
  });
};

export const CoingeckoUtils = {
  fetchCoingeckoPlatformsConfig,
  fetchCoingeckoTokensConfig,
  fetchCoingeckoCoinData,
};
