import { PublicKey, Signature, cryptoUtils } from "@hiveio/dhive";
import { NextFunction, Request, Response } from "express";
import { SwapApiResponse } from "hive-keychain-commons";
import { HiveUtils } from "../utils/hive.utils";

export const enum Role {
  ADMIN = "ADMIN",
  TEAM = "TEAM",
  NONE = "NONE",
}

const ADMINS = ["cedricguillas", "stoodkev"];
const TEAM_MEMBERS = ["theghost.1980", "manuphotos"];

const USER_LIST_ROLE = {
  [Role.ADMIN]: ADMINS,
  [Role.TEAM]: [...ADMINS, ...TEAM_MEMBERS],
};

const checkRole = async (userList: string[], message: string) => {
  const { expirationDate, encoded } = JSON.parse(atob(message));

  if (Number(expirationDate) < Date.now()) {
    console.log("Token has expired. Login again");
    throw { message: "Token has expired. Login again", statusCode: 440 };
  }

  const accounts = await HiveUtils.getClient().database.getAccounts(userList);
  for (const account of accounts) {
    const signature = Signature.fromString(encoded);
    const key = PublicKey.fromString(account.posting.key_auths[0][0] as string);
    const result = key.verify(
      cryptoUtils.sha256(expirationDate.toString()),
      signature
    );
    if (result) return true;
  }
  throw { message: "Not authorized", statusCode: 403 };
};

export const accessCheck = (roleRequired: Role) => {
  return async (
    req: Request,
    res: Response<SwapApiResponse>,
    next: NextFunction
  ) => {
    let accessGranted = false;
    try {
      if (roleRequired === Role.NONE) accessGranted = true;
      else {
        accessGranted = await checkRole(
          USER_LIST_ROLE[roleRequired as Role],
          req.headers.message as string
        );
      }
      next();
    } catch (err) {
      res
        .status(err.statusCode)
        .send({ error: { message: err.message, code: err.statusCode } });
    }
  };
};
