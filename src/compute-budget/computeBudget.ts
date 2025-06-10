import {
    ComputeBudgetProgram,
    Connection,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';
import {getPriorityFeeEstimate} from "./getPriorityFees";

export type ComputeBudgetConfig = {
    destination?: 'PRIORITY_FEE' | 'JITO' | 'NOZOMI';

    // Fee type, default is DYNAMIC
    type?: 'DYNAMIC' | 'FIXED';

    // Fee speed (only used if type is DYNAMIC), default is NORMAL
    speed?: 'NORMAL' | 'FAST' | 'TURBO';

    // Used as max priority fee if type is DYNAMIC, or as fixed fee if type is FIXED
    price: number;

    // Compute unit limit
    limit?: number;
};

const DEFAULT_COMPUTE_LIMIT = 1_000_000;
const DEFAULT_UNIT_PRICE = 50_000;

const SPEED_BUFFERS = {
    NORMAL: 1.1,
    FAST: 2,
    TURBO: 4
} as const;

export const DEFAULT_CONFIG: ComputeBudgetConfig = {
    destination: 'PRIORITY_FEE',
    type: 'DYNAMIC',
    speed: 'NORMAL',
    price: DEFAULT_UNIT_PRICE,
    limit: DEFAULT_COMPUTE_LIMIT
};

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
        console.error('Failed to get Helius dynamic priority fee', e);
    }

    let recentFees = await connection.getRecentPrioritizationFees({
        lockedWritableAccounts: writableAccounts
    });
    recentFees = recentFees.filter((r) => r.prioritizationFee > 0);

    console.debug('writableAccounts', writableAccounts);
    console.debug('recentFees', recentFees);

    if (!recentFees.length) {
        return DEFAULT_UNIT_PRICE * SPEED_BUFFERS[speed];
    }

    const sortedFees = recentFees.map((fee) => fee.prioritizationFee).sort((a, b) => a - b);

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

    return Math.ceil(percentileFee * SPEED_BUFFERS[speed]);
}

function getWritableAccounts(instructions: TransactionInstruction[]): PublicKey[] {
    return instructions
        .flatMap((ix) => ix.keys)
        .filter((meta) => meta.isWritable)
        .map((meta) => meta.pubkey)
        .filter((v, i, a) => a.findIndex((t) => t.equals(v)) === i);
}

export async function createPriorityFeeTxn(
    connection: Connection,
    request: ComputeBudgetConfig,
    instructions: TransactionInstruction[]
): Promise<TransactionInstruction[]> {
    if (request.type === 'FIXED') {
        return createComputeBudgetIx(request.limit, request.price);
    }

    const writableAccounts = getWritableAccounts(instructions);
    let price = await getDynamicPriorityFee(
        connection,
        writableAccounts,
        request.speed || 'NORMAL'
    );
    price = Math.min(price, request.price);

    return createComputeBudgetIx(request.limit, price);
}

export const createComputeBudgetIx = (unitLimit: number | undefined, unitPrice: number) => {
    return [
        ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit || DEFAULT_COMPUTE_LIMIT }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice })
    ];
}
