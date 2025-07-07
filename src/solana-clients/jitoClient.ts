import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import fetch from 'cross-fetch';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { JitoJsonRpcClient } from 'jito-js-rpc';
import {
    Connection,
    SystemProgram,
    VersionedTransaction,
    PublicKey,
    TransactionInstruction,
    MessageV0,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { TransactionBuilder } from '../transaction-builder';
import { SolanaClient } from './solanaClient';
import { ComputeBudgetConfig } from '../compute-budget';

const JITO_MIN_TIP_AMOUNT = 1000;

export const JITO_BASE_URL = 'mainnet.block-engine.jito.wtf';
export const JITO_RPC_URL = 'https://' + JITO_BASE_URL + '/api/v1';

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
    maxTransactionCount: number;
    transactions: VersionedTransaction[];
}

const mapLatestTips = (tipResponse: any): LatestTips => {
    const [tipData] = tipResponse;
    return {
        time: tipData.time,
        landedTips25thPercentile: tipData.landed_tips_25th_percentile,
        landedTips50thPercentile: tipData.landed_tips_50th_percentile,
        landedTips75thPercentile: tipData.landed_tips_75th_percentile,
        landedTips95thPercentile: tipData.landed_tips_95th_percentile,
        landedTips99thPercentile: tipData.landed_tips_99th_percentile,
        emaLandedTips50thPercentile: tipData.ema_landed_tips_50th_percentile
    };
};

export class JitoClient implements SolanaClient {
    private client: JitoJsonRpcClient;
    private tips: LatestTips;

    constructor(jitoRpcUrl: string = JITO_RPC_URL, uuid: string = process.env.JITO_UUID ?? '') {
        this.client = new JitoJsonRpcClient(jitoRpcUrl, uuid);
        const minTipFloat = JITO_MIN_TIP_AMOUNT / LAMPORTS_PER_SOL;
        this.tips = {
            time: '0',
            landedTips25thPercentile: minTipFloat,
            landedTips50thPercentile: minTipFloat,
            landedTips75thPercentile: minTipFloat,
            landedTips95thPercentile: minTipFloat,
            landedTips99thPercentile: minTipFloat,
            emaLandedTips50thPercentile: minTipFloat
        };
    }

    async sendTransactions(transactions: VersionedTransaction[]): Promise<string> {
        const signature = bs58.encode(transactions[0].signatures[0]);
        const base64Txs = [
            ...new Set(
                transactions.map((tx) => {
                    return Buffer.from(tx.serialize()).toString('base64');
                })
            )
        ];

        const result = await this.client.sendBundle([base64Txs, { encoding: 'base64' }]);
        if (result.error) {
            throw new Error(result.error);
        }

        return signature;
    }

    private async fetchLatestTips(): Promise<LatestTips> {
        try {
            const response = await fetch('https://solana.wasabi.xyz/api/solana/jito_tips');

            if (!response.ok) {
                console.error('Failed to fetch latest tips');
                return this.tips;
            }

            const tipResponse = await response.json();
            this.tips = mapLatestTips(tipResponse);

            return this.tips;
        } catch (error) {
            console.error('Error fetching tips:', error);
            return this.tips;
        }
    }

    public async getTips(): Promise<LatestTips> {
        return await this.fetchLatestTips();
    }

    public async getTipAmount(computeBudgetConfig: ComputeBudgetConfig): Promise<number> {
        let tipAmount = computeBudgetConfig.price;

        if (computeBudgetConfig.type === 'DYNAMIC') {
            const latestTips = await this.getTips();
            switch (computeBudgetConfig.speed) {
                case 'NORMAL':
                    tipAmount = Math.ceil(latestTips.landedTips50thPercentile * LAMPORTS_PER_SOL);
                    break;
                case 'FAST':
                    tipAmount = Math.ceil(latestTips.landedTips75thPercentile * LAMPORTS_PER_SOL);
                    break;
                case 'TURBO':
                    tipAmount = Math.ceil(latestTips.landedTips95thPercentile * LAMPORTS_PER_SOL);
                    break;
                default:
                    throw new Error('Invalid speed: ' + computeBudgetConfig.speed);
            }
        }

        return tipAmount;
    }

    public async getTipAmountAndAccount(
        computeBudgetConfig: ComputeBudgetConfig
    ): Promise<[number, PublicKey]> {
        return [
            await this.getTipAmount(computeBudgetConfig),
            new PublicKey(JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)])
        ];
    }

    async fetchLatestTipsFromWs(): Promise<void> {
        const ws = new WebSocket('wss://bundles.jito.wtf/api/v1/bundles/tip_floor');
        ws.onopen = () => {
            console.info('Connected to Jito');
        };

        ws.onmessage = (rawData: any) => {
            const data = JSON.parse(rawData.toString());
            this.tips = mapLatestTips(data);
        };

        ws.onclose = () => {
            console.info('Disconnected from Jito');
            this.fetchLatestTipsFromWs();
        };

        ws.onerror = (error) => {
            console.error('Error: ', error);
        };
    }

    /// Create a tip instruction
    async createTipInstruction(
        payer: PublicKey,
        computeBudgetConfig: ComputeBudgetConfig
    ): Promise<TransactionInstruction> {
        const tipAccount = new PublicKey(
            JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]
        );

        let tipAmount: number;

        if (computeBudgetConfig.type === 'FIXED') {
            tipAmount = computeBudgetConfig.price;
        } else {
            // Default is DYNAMIC
            const latestTips = await this.getTips();
            switch (computeBudgetConfig.speed) {
                case 'NORMAL':
                    tipAmount = Math.ceil(
                        latestTips.emaLandedTips50thPercentile * LAMPORTS_PER_SOL
                    );
                    break;
                case 'FAST':
                    tipAmount = Math.ceil(latestTips.landedTips75thPercentile * LAMPORTS_PER_SOL);
                    break;
                case 'TURBO':
                    tipAmount = Math.ceil(latestTips.landedTips95thPercentile * LAMPORTS_PER_SOL);
                    break;
                default:
                    throw new Error('Invalid speed: ' + computeBudgetConfig.speed);
            }
            tipAmount = Math.min(tipAmount, computeBudgetConfig.price);
        }

        return SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: tipAccount,
            lamports: tipAmount
        });
    }

    async appendTipInstruction(
        connection: Connection,
        payer: PublicKey,
        computeBudgetConfig: ComputeBudgetConfig,
        transactions: VersionedTransaction[]
    ): Promise<VersionedTransaction[]> {
        const message = transactions[transactions.length - 1].message as MessageV0;
        const instructions = message.compiledInstructions.map((ix) => {
            const keys = ix.accountKeyIndexes.map((index) => ({
                pubkey: message.staticAccountKeys[index],
                isSigner: message.isAccountSigner(index),
                isWritable: message.isAccountWritable(index)
            }));

            const programId = message.staticAccountKeys[ix.programIdIndex];

            return new TransactionInstruction({
                keys,
                programId,
                data: Buffer.from(ix.data)
            });
        });

        const tipInstruction = await this.createTipInstruction(payer, computeBudgetConfig);
        instructions.push(tipInstruction);

        const ixes = transactions.length === 1 ? instructions.slice(2) : instructions.slice(1);

        const newTx = await new TransactionBuilder()
            .setPayer(payer)
            .setConnection(connection)
            .addInstructions(...ixes)
            .setComputeBudgetConfig(
                transactions.length === 1
                    ? computeBudgetConfig
                    : {
                          destination: 'PRIORITY_FEE',
                          type: 'FIXED',
                          price: 0
                      }
            )
            .setStripLimitIx(true)
            .build();

        transactions[transactions.length - 1] = newTx;

        return transactions;
    }

    /// Transaction should be signed after this step and then bundled
    async appendTipTransaction(
        connection: Connection,
        payer: PublicKey,
        computeBudgetConfig: ComputeBudgetConfig,
        transactions: VersionedTransaction[]
    ): Promise<VersionedTransaction[]> {
        const tipInstruction = await this.createTipInstruction(payer, computeBudgetConfig);

        const tipTransaction = await new TransactionBuilder()
            .setPayer(payer)
            .setConnection(connection)
            .addInstructions(tipInstruction)
            .setComputeBudgetConfig({
                destination: 'PRIORITY_FEE',
                type: 'FIXED',
                price: 0
            })
            .setStripLimitIx(true)
            .build();

        transactions.push(tipTransaction);

        return transactions;
    }
}
