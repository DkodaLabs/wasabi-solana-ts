import { VersionedTransaction } from '@solana/web3.js';

export const JITO_BASE_URL = 'mainnet.block-engine.jito.wtf'
export const JITO_RPC_URL = 'https://' + JITO_BASE_URL + '/api/v1';
export const UUID = process.env.JITO_UUID

export interface Bundle {
    transactions: Uint8Array[];
    maxTransactionCount: number;
}

export interface JitoClient {
    sendBundle(transactions: VersionedTransaction[]): Promise<string>;

    confirmBundle(bundleId: string): Promise<void>;
}
