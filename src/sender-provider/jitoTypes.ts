import { VersionedTransaction } from '@solana/web3.js';

export const DEFAULT_JITO_URL = 'https://ny.mainnet.block-engine.jito.wtf/api/v1'
export const UUID = '79d9c200-d906-11ef-90fb-bf41cb39c257';

export interface Bundle {
    transactions: Uint8Array[];
    maxTransactionCount: number;
}

export interface JitoClient {
    sendBundle(transactions: VersionedTransaction[]): Promise<string>;

    confirmBundle(bundleId: string): Promise<void>;
}
