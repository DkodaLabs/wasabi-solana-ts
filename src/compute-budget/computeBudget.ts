import {
    AddressLookupTableAccount,
    Commitment,
    ComputeBudgetProgram,
    Connection,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    Version,
    VersionedTransaction
} from '@solana/web3.js';

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
    let recentFees = await connection.getRecentPrioritizationFees({
        lockedWritableAccounts: writableAccounts
    });
    recentFees = recentFees.filter((r) => r.prioritizationFee > 0);

    if (!recentFees.length) {
        return DEFAULT_UNIT_PRICE * SPEED_BUFFERS[speed];
    }

    const sortedFees = recentFees.map((fee) => fee.prioritizationFee).sort((a, b) => a - b);

    const midPoint = Math.floor(sortedFees.length / 2);
    const medianFee =
        sortedFees.length % 2 === 0
            ? (sortedFees[midPoint - 1] + sortedFees[midPoint]) / 2
            : sortedFees[midPoint];

    return Math.ceil(medianFee * SPEED_BUFFERS[speed]);
}

function getWritableAccounts(instructions: TransactionInstruction[]): PublicKey[] {
    return instructions
        .flatMap((ix) => ix.keys)
        .filter((meta) => meta.isWritable)
        .map((meta) => meta.pubkey)
        .filter((v, i, a) => a.findIndex((t) => t.equals(v)) === i);
}

export async function createComputeBudgetIx(
    connection: Connection,
    request: ComputeBudgetConfig,
    instructions: TransactionInstruction[]
): Promise<TransactionInstruction[]> {
    if (request.type === 'FIXED') {
        return [
            ComputeBudgetProgram.setComputeUnitLimit({
                units: request.limit || DEFAULT_COMPUTE_LIMIT
            }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: request.price })
        ];
    }

    const writableAccounts = getWritableAccounts(instructions);

    let price = await getDynamicPriorityFee(
        connection,
        writableAccounts,
        request.speed || 'NORMAL'
    );
    price = Math.min(price, request.price);

    return [
        ComputeBudgetProgram.setComputeUnitLimit({ units: request.limit || DEFAULT_COMPUTE_LIMIT }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: price })
    ];
}

export async function createVersionedTransactionWithComputeLimit(
    payerKey: PublicKey,
    connection: Connection,
    instructions: TransactionInstruction[],
    lookupTables?: AddressLookupTableAccount[],
    commitment: Commitment = 'confirmed'
): Promise<VersionedTransaction> {
    let recentBlockhash = (await connection.getLatestBlockhash(commitment)).blockhash;

    let messageV0 = new TransactionMessage({
        payerKey,
        recentBlockhash,
        instructions
    }).compileToV0Message(lookupTables);

    const transaction = new VersionedTransaction(messageV0);

    // We need to amend computeLimit as during high network load, validators may not pick up transactions
    // that have a computeLimit that is much higher than the actual amount of compute units consumed
    const simResult = await this.program.provider.connection.simulateTransaction(transaction);

    if (simResult.value.err) {
        console.error('Failed to simulate transaction:', simResult.value.err);
        return transaction;
    }

    if (!simResult.value.unitsConsumed) {
        console.warn('No units consumed, skipping compute limit adjustment');
        return transaction;
    }

    const actualUnitsConsumed = simResult.value.unitsConsumed;

    if (instructions[0].data.length < 5) {
        throw new Error('Failed to deserialize compute budget instruction');
    }

    const currentComputeLimit = instructions[0].data.readUint32LE(1);
    console.log('Current compute limit:', currentComputeLimit);
    console.log('Actual units consumed:', simResult.value.unitsConsumed);

    // if the simulation does not return the units consumed then skip the calculation
    // if the currentComputeLimit is greater than the actual units consumed + 50%
    // then we should reduce the actual compute limit to the actual units consumed + 20%
    // or if the currentComputeLimit is less than the actual units consumed
    // then we should increase the actual compute limit to the actual units consumed + 20%
    if (
        currentComputeLimit > actualUnitsConsumed * 1.5 ||
        currentComputeLimit < actualUnitsConsumed
    ) {
        const actualUnitsConsumedWithBuffer = actualUnitsConsumed * 1.2;
        console.log('Amending compute limit to:', actualUnitsConsumedWithBuffer);
        instructions[0] = ComputeBudgetProgram.setComputeUnitLimit({
            units: actualUnitsConsumedWithBuffer
        });

        recentBlockhash = await connection.getLatestBlockhash(commitment).then((r) => r.blockhash);
        messageV0 = new TransactionMessage({
            payerKey,
            recentBlockhash,
            instructions
        }).compileToV0Message(lookupTables);

        return new VersionedTransaction(messageV0);
    }

    return transaction;
}

function adjustComputeLimit(
    instructions: TransactionInstruction[],
    currentComputeLimit: number,
    actualUnitsConsumed: number
): void {
    if (
        currentComputeLimit > actualUnitsConsumed * 1.5 ||
        currentComputeLimit < actualUnitsConsumed
    ) {
        const actualUnitsConsumedWithBuffer = actualUnitsConsumed * 1.2;
        console.log('Amending compute limit to:', actualUnitsConsumedWithBuffer);
        instructions[0] = ComputeBudgetProgram.setComputeUnitLimit({
            units: actualUnitsConsumedWithBuffer
        });
    }
}

function buildVersionedTransaction(
    payerKey: PublicKey,
    blockhash: string,
    instructions: TransactionInstruction[],
    lookupTables?: AddressLookupTableAccount[]
): VersionedTransaction {
    const messageV0 = new TransactionMessage({
        payerKey,
        recentBlockhash: blockhash,
        instructions
    }).compileToV0Message(lookupTables);

    return new VersionedTransaction(messageV0);
}
