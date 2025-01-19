import {
    ComputeBudgetProgram,
    Connection,
    PublicKey,
    TransactionInstruction
} from '@solana/web3.js';
import {getPriorityFeeEstimate} from "./getPriorityFees";

export type ComputeBudgetConfig = {
    // Fee type, default is DYNAMIC
    type?: 'DYNAMIC' | 'FIXED';

    // Fee speed (only used if type is DYNAMIC), default is NORMAL
    speed?: 'NORMAL' | 'FAST' | 'TURBO';

    // Used as max priority fee if type is DYNAMIC, or as fixed fee if type is FIXED
    price: number;

    // Compute unit limit
    limit?: number;
};

const DEFAULT_COMPUTE_LIMIT = 400_000;
const DEFAULT_UNIT_PRICE = 50_000;

const SPEED_BUFFERS = {
    NORMAL: 1.1,
    FAST: 2,
    TURBO: 4
} as const;

async function getDynamicPriorityFee(
    connection: Connection,
    writableAccounts: PublicKey[],
    speed: 'NORMAL' | 'FAST' | 'TURBO'
): Promise<number> {
    try {
        const heliusFeeEstimates = await getPriorityFeeEstimate(writableAccounts.map(a => a.toBase58()));
        if (speed === "NORMAL") {
            return heliusFeeEstimates.result.priorityFeeLevels.medium;
        } else if (speed === "FAST") {
            return heliusFeeEstimates.result.priorityFeeLevels.high;
        } else if (speed === "TURBO") {
            return heliusFeeEstimates.result.priorityFeeLevels.veryHigh;
        }
    } catch (e: any) {
        console.error('Failed to get dynamic priority fee', e);
    }

    let recentFees = await connection.getRecentPrioritizationFees({
        lockedWritableAccounts: writableAccounts
    });
    recentFees = recentFees.filter(r => r.prioritizationFee > 0);

    console.log('writableAccounts', writableAccounts);
    console.log('recentFees', recentFees);

    if (!recentFees.length) {
        return DEFAULT_UNIT_PRICE * SPEED_BUFFERS[speed];
    }

    const sortedFees = recentFees
        .map(fee => fee.prioritizationFee)
        .sort((a, b) => a - b);

    // Calculate the 75th percentile
    const position = 0.75 * (sortedFees.length - 1); // 75th percentile index
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);

    if (upperIndex >= sortedFees.length) {
        return DEFAULT_UNIT_PRICE * SPEED_BUFFERS[speed];
    }

    const percentileFee = lowerIndex === upperIndex
      ? sortedFees[lowerIndex]
      : sortedFees[lowerIndex] + (position - lowerIndex) * (sortedFees[upperIndex] - sortedFees[lowerIndex]);

    console.log('percentileFee', percentileFee);

    return Math.ceil(percentileFee * SPEED_BUFFERS[speed]);
}

function getWritableAccounts(instructions: TransactionInstruction[]): PublicKey[] {
    return instructions
        .flatMap(ix => ix.keys)
        .filter(meta => meta.isWritable)
        .map(meta => meta.pubkey)
        .filter((v, i, a) => a.findIndex(t => t.equals(v)) === i);
}

export async function createComputeBudgetIx(
    connection: Connection,
    request: ComputeBudgetConfig,
    instructions: TransactionInstruction[]
): Promise<TransactionInstruction[]> {
    if (request.type === 'FIXED') {
        return [
            ComputeBudgetProgram.setComputeUnitLimit({ units: request.limit || DEFAULT_COMPUTE_LIMIT }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: request.price })
        ];
    }

    const writableAccounts = getWritableAccounts(instructions);

    let price = await getDynamicPriorityFee(connection, writableAccounts, request.speed || "NORMAL");
    price = Math.min(price, request.price);

    return [
        ComputeBudgetProgram.setComputeUnitLimit({ units: request.limit || DEFAULT_COMPUTE_LIMIT }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: price })
    ];
}
