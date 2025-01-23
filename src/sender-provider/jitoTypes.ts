import { VersionedTransaction } from '@solana/web3.js';

export const DEFAULT_JITO_URL = 'https://ny.mainnet.block-engine.jito.wtf/api/v1'
export const UUID = process.env.JITO_UUID

export interface Bundle {
    transactions: Uint8Array[];
    maxTransactionCount: number;
}

export interface JitoClient {
    sendBundle(transactions: VersionedTransaction[]): Promise<string>;

    confirmBundle(bundleId: string): Promise<void>;
}
