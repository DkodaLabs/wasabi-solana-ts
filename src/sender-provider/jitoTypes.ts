import {
  Connection,
  PublicKey,
  VersionedTransaction
} from '@solana/web3.js';

export const DEFAULT_JITO_URL = 'https://ny.mainnet.block-engine.jito.wtf/api/v1'
export const UUID = '79d9c200-d906-11ef-90fb-bf41cb39c257';

export interface Bundle {
  transactions: Uint8Array[];
  maxTransactionCount: number;
}

export interface LeaderInfo {
  currentSlot: number;
  nextLeaderSlot: number;
  nextLeaderIdentity: string;
}

export interface JitoClient {
  sendBundle(transactions: VersionedTransaction[]): Promise<string>;
  
  confirmBundle(bundleId: string): Promise<void>;

  createTipTransaction(
    connection: Connection,
    payer: PublicKey,
    tipAmount: number
  ): Promise<VersionedTransaction>;
}

export interface LatestTips {
  time: string;
  landedTips25thPercentile: number;
  landedTips50thPercentile: number;
  landedTips75thPercentile: number;
  landedTips95thPercentile: number;
  landedTips99thPercentile: number;
  emaLandedTips50thPercentile: number;
}