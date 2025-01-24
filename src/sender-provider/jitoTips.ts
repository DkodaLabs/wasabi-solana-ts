import {
    VersionedTransaction,
    TransactionInstruction,
    PublicKey,
    SystemProgram
} from '@solana/web3.js';
import axios from 'axios';

// NOTE: These remain fairly constant
const JITO_TIP_ACCOUNTS = [
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
];

export const getRandomTipAccount = (): PublicKey => {
    return new PublicKey(JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]);
}

export type Percentile = 25 | 50 | 75 | 95 | 99;
const V0_TX_LIMIT = 1644;
//const LEGACY_TX_LIMIT = 1232;

export interface LatestTips {
    time: string;
    landedTips25thPercentile: number;
    landedTips50thPercentile: number;
    landedTips75thPercentile: number;
    landedTips95thPercentile: number;
    landedTips99thPercentile: number;
    emaLandedTips50thPercentile: number;
}

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
    return (transaction.message.serialize().length + transaction.signatures.length * 64) > V0_TX_LIMIT;
};


// A tip transaction is ~220 bytes (rough estimation 64 bytes for signature + 1 for length prefix)
// A tip instruction is ~150 bytes (exactly 152 bytes)
export const createTipInstruction = (
    payer: PublicKey,
    tipAmount: number
): TransactionInstruction => {
    return SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: getRandomTipAccount(),
        lamports: tipAmount
    });
};
