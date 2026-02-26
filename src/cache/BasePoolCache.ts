import {PublicKey} from "@solana/web3.js";
import NodeCache from "node-cache";
import {Program} from "@coral-xyz/anchor";
import {WasabiSolana} from "../idl";

export type BasePoolAccountData = {
  isLongPool: boolean;
  currency: PublicKey;
  collateral: PublicKey;
  currencyVault: PublicKey;
  collateralVault: PublicKey;
}

const poolCache = new NodeCache();

export const findPoolCached = async (
  program: Program<WasabiSolana>, poolId: PublicKey
): Promise<BasePoolAccountData | null> => {
  const cachedPool = poolCache.get(poolId.toString());
  if (cachedPool) {
    return cachedPool as BasePoolAccountData;
  }

  const poolAccount: BasePoolAccountData | null = await program.account.basePool.fetchNullable(poolId);
  if (poolAccount) {
    poolCache.set(poolId.toString(), poolAccount);
  }
  return poolAccount;
}