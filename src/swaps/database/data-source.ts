/* istanbul ignore file */

import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { BaseEstimate } from "./entities/base-estimate.entity";
import { SwapStep } from "./entities/swap-step.entity";

export const SwapDataSource = new DataSource({
  type: "mysql",
  host: process.env.SWAP_DB_HOST,
  port: parseInt(process.env.SWAP_DB_PORT!),
  username: process.env.SWAP_DB_USER,
  password: process.env.SWAP_DB_PASSWORD,
  database: process.env.SWAP_DB_NAME,
  synchronize: true,
  logging: false,
  entities: [SwapStep, BaseEstimate],
  migrations: [],
  subscribers: [],
});
