import axios from 'axios';
import { JitoJsonRpcClient } from 'jito-js-rpc';
import {
    Connection,
    SystemProgram,
    VersionedTransaction,
    PublicKey,
} from '@solana/web3.js';
import { TransactionBuilder } from '../transaction-builder';
import { SolanaClient } from './solanaClient';
import { ComputeBudgetConfig } from '../compute-budget';

export const JITO_BASE_URL = 'mainnet.block-engine.jito.wtf'
export const JITO_RPC_URL = 'https://' + JITO_BASE_URL + '/api/v1';
export const UUID = process.env.JITO_UUID

export const JITO_TIP_ACCOUNTS = [
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
];

export interface LatestTips {
    time: string;
    landedTips25thPercentile: number;
    landedTips50thPercentile: number;
    landedTips75thPercentile: number;
    landedTips95thPercentile: number;
    landedTips99thPercentile: number;
    emaLandedTips50thPercentile: number;
}

export interface Bundle {
    transactions: Uint8Array[];
    maxTransactionCount: number;
}

export class JitoClient implements SolanaClient {
    private client: JitoJsonRpcClient;
    constructor(jitoRpcUrl: string = process.env.JITO_RPC_URL, uuid: string = UUID) {
        this.client = new JitoJsonRpcClient(jitoRpcUrl, uuid);
    }

    async sendTransactions(transactions: VersionedTransaction[]): Promise<string> {
        const base64Txs = [
            ...new Set(
                transactions.map((tx) => {
                    return Buffer.from(tx.serialize()).toString('base64');
                })
            )
        ];
        return this.client.sendBundle([base64Txs, { encoding: 'base64' }]);
    }

    confirmTransactions(bundleId: string): Promise<void> {
        const result = this.client.confirmInflightBundle(bundleId);
        if (result.status === 'Failed') {
            throw new Error(result.error);
        }

        return;
    }

    async fetchLatestTips(): Promise<LatestTips> {
        const client = axios.create({
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const response = await client.get('https://bundles.jito.wtf/api/v1/bundles/tip_floor');
        return response.data;
    };

    /// Transaction should be signed after this step and then bundled
    async appendTipTransaction(
        connection: Connection,
        payer: PublicKey,
        computeBudgetConfig: ComputeBudgetConfig,
        transactions: VersionedTransaction[]
    ): Promise<VersionedTransaction[]> {
        const tipAccount = new PublicKey(
            JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]
        );

        let tipAmount = computeBudgetConfig.tipAmount || 0;
        if (computeBudgetConfig.type !== 'FIXED') {
            const latestTips = await this.fetchLatestTips();
            switch (computeBudgetConfig.speed) {
                case 'NORMAL':
                    tipAmount = latestTips.emaLandedTips50thPercentile;
                    break;
                case 'FAST':
                    tipAmount = latestTips.landedTips75thPercentile;
                    break;
                case 'TURBO':
                    tipAmount = latestTips.landedTips95thPercentile;
                    break;
                default:
                    throw new Error("Invalid speed");
            }

            const tipInstruction = SystemProgram.transfer({
                fromPubkey: payer,
                toPubkey: tipAccount,
                lamports: tipAmount,
            });

            const builder = new TransactionBuilder()
                .setPayer(payer)
                .setConnection(connection)
                .addInstructions(tipInstruction);

            const tipTransaction = await builder.build();

            transactions.push(tipTransaction);

            return transactions;
        }
    }
}
