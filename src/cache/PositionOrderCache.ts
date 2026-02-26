import { PublicKey } from "@solana/web3.js";
import NodeCache from "node-cache";
import { Program } from "@coral-xyz/anchor";
import { WasabiSolana } from "../idl";
import {PDA} from "../utils";

export type OrdersCache = {
  hasSL: boolean;
  hasTP: boolean;
};

const ORDERS_CACHE_TTL = 30;

const ordersCache = new NodeCache({ stdTTL: ORDERS_CACHE_TTL });

export const findOrdersCached = async (
  program: Program<WasabiSolana>,
  positionAddress: PublicKey,
): Promise<OrdersCache> => {
  const cacheKey = positionAddress.toString();
  const cached = ordersCache.get<OrdersCache>(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const accounts = await program.provider.connection.getMultipleAccountsInfo(
    [PDA.getStopLossOrder(positionAddress), PDA.getTakeProfitOrder(positionAddress)]
  );

  const result: OrdersCache = {
    hasSL: accounts[0] !== null,
    hasTP: accounts[1] !== null,
  };

  ordersCache.set(cacheKey, result);

  return result;
};

export const invalidateOrdersCache = (positionAddress: PublicKey): void => {
  ordersCache.del(positionAddress.toString());
};