import {
    Commitment,
    ComputeBudgetProgram,
    Connection,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    AddressLookupTableAccount
} from '@solana/web3.js';
import { ComputeBudgetConfig, createComputeBudgetIx } from '../compute-budget';

export class TransactionBuilder {
    private payerKey!: PublicKey;
    private connection!: Connection;
    private instructions: TransactionInstruction[] = [];
    private lookupTables?: AddressLookupTableAccount[];
    private computeBudgetConfig?: ComputeBudgetConfig;
    private commitment: Commitment = 'confirmed';
    private limitBuffer: number = 1.2;

    setPayer(payerKey: PublicKey): this {
        this.payerKey = payerKey;
        return this;
    }

    setConnection(connection: Connection): this {
        this.connection = connection;
        return this;
    }

    addInstructions(...instructions: TransactionInstruction[]): this {
        this.instructions.push(...instructions);
        return this;
    }

    setLookupTables(lookupTables: AddressLookupTableAccount[]): this {
        this.lookupTables = lookupTables;
        return this;
    }

    setComputeBudgetConfig(computeBudgetConfig: ComputeBudgetConfig): this {
        this.computeBudgetConfig = computeBudgetConfig;
        return this;
    }

    setCommitment(commitment: Commitment): this {
        this.commitment = commitment;
        return this;
    }

    setLimitBuffer(limitBuffer: number): this {
        this.limitBuffer = limitBuffer;
        return this;
    }

    private async createComputeBudgetInstructions(): Promise<TransactionInstruction[]> {
        if (!this.computeBudgetConfig) {
            return [];
        }
        return createComputeBudgetIx(this.connection, this.computeBudgetConfig, this.instructions);
    }

    private adjustComputeLimit(
        computeBudgetIx: TransactionInstruction[],
        currentComputeLimit: number,
        actualUnitsConsumed: number
    ): void {
        const actualUnitsConsumedWithBuffer = actualUnitsConsumed * this.limitBuffer;
        if (
            currentComputeLimit > actualUnitsConsumedWithBuffer ||
            currentComputeLimit < actualUnitsConsumed
        ) {
            console.debug("Actual units consumed:", actualUnitsConsumed);
            const adjustedLimit = Math.ceil(actualUnitsConsumedWithBuffer);
            console.debug('Adjusting compute limit to:', adjustedLimit);

            computeBudgetIx[0] = ComputeBudgetProgram.setComputeUnitLimit({ units: adjustedLimit });
        }
    }

    async build(): Promise<VersionedTransaction> {
        if (!this.payerKey || !this.connection) {
            throw new Error('Payer and connection must be set before building a transaction.');
        }

        if (!this.instructions || this.instructions.length === 0) {
            throw new Error('No instructions to build transaction with.');
        }

        const computeBudgetInstructions = await this.createComputeBudgetInstructions();
        this.instructions = [...computeBudgetInstructions, ...this.instructions];

        const blockhash = (await this.connection.getLatestBlockhash(this.commitment)).blockhash;

        let transaction = new VersionedTransaction(
            new TransactionMessage({
                payerKey: this.payerKey,
                recentBlockhash: blockhash,
                instructions: this.instructions
            }).compileToV0Message(this.lookupTables)
        );

        const simResult = await this.connection.simulateTransaction(transaction);
        if (simResult.value.err) {
            throw new Error("Transaction simulation failed: " + JSON.stringify(simResult.value.err));
        }

        if (simResult.value.unitsConsumed && !this.computeBudgetConfig.limit) {
            const actualUnitsConsumed = simResult.value.unitsConsumed;

            if (computeBudgetInstructions.length > 0) {
                const currentComputeLimit = computeBudgetInstructions[0].data.readUint32LE(1);
                this.adjustComputeLimit(
                    computeBudgetInstructions,
                    currentComputeLimit,
                    actualUnitsConsumed
                );

                transaction = new VersionedTransaction(
                    new TransactionMessage({
                        payerKey: this.payerKey,
                        recentBlockhash: blockhash,
                        instructions: this.instructions
                    }).compileToV0Message(this.lookupTables)
                );
            }
        }

        return transaction;
    }
}