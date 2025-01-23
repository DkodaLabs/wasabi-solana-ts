import { VersionedTransaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import { LatestTips } from './jitoTypes';
import axios from 'axios';

export type Percentile = 25 | 50 | 75 | 95 | 99;
const V0_TX_LIMIT = 1644;
//const LEGACY_TX_LIMIT = 1232;

// 30% of the total priority fee - intended to be used in addition to the priority fee for the `/transaction`
// endpoint
export const getTipAmountFromPriorityFee = (transaction: VersionedTransaction): number => {
  const instructions = transaction.message.compiledInstructions;
  const computeLimit = new DataView(instructions[0].data.buffer).getUint32(1, true);
  const computePrice = new DataView(instructions[1].data.buffer).getBigUint64(1, true);
  return Number((BigInt(computeLimit) * computePrice) / BigInt(3000000));
};

export const getTipWithPercentile = async (percentile: Percentile): Promise<number> => {
  const latestTips: LatestTips = await getLatestTipsFromRpc();
  switch (percentile) {
    case 25:
      return latestTips.landedTips25thPercentile;
    case 50:
      return latestTips.landedTips50thPercentile;
    case 75:
      return latestTips.landedTips75thPercentile;
    case 95:
      return latestTips.landedTips95thPercentile;
    case 99:
      return latestTips.landedTips99thPercentile;
    default:
      return latestTips.landedTips75thPercentile;
  }
};

export const getLatestTipsFromRpc = async (): Promise<LatestTips> => {
  const client = axios.create({
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const response = await client.get('https://bundles.jito.wtf/api/v1/bundles/tip_floor');
  return response.data;
};

export const needBundle = (transaction: VersionedTransaction): boolean => {
  const transactionSize = transaction.message.serialize().length + transaction.signatures.length * 64;
  if (transactionSize > V0_TX_LIMIT) {
    return true;
  }
  return false;
};

export const stripComputeLimit = (instructions: TransactionInstruction[]): TransactionInstruction[] => {
  instructions[0] = ComputeBudgetProgram.setComputeUnitLimit({ units: 0 });
  return instructions;
};
