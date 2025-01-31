import {
    Commitment,
    ComputeBudgetProgram,
    Connection,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    AddressLookupTableAccount,
    Blockhash
} from '@solana/web3.js';
import {
    ComputeBudgetConfig,
    createComputeBudgetIx,
    createPriorityFeeTxn,
    DEFAULT_CONFIG
} from '../compute-budget';
import { SimulationError } from '../error-handling';

export class TransactionBuilder {
    private payerKey!: PublicKey;
    private connection!: Connection;
    private instructions: TransactionInstruction[] = [];
    private lookupTables?: AddressLookupTableAccount[];

    // Default compute budget config
    private computeBudgetConfig: ComputeBudgetConfig = DEFAULT_CONFIG;
    private commitment: Commitment = 'confirmed';
    private limitBuffer: number = 1.2;

    // Identifies a tip transaction
    private stripLimit: boolean = false;

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

    setStripLimitIx(stripLimitIx: boolean): this {
        this.stripLimit = stripLimitIx;
        return this;
    }

    private async createComputeBudgetInstructions(): Promise<TransactionInstruction[]> {
        if (this.computeBudgetConfig.destination === 'JITO') {
            // Create a compute budget instruction with 0 priority fees
            return createComputeBudgetIx(this.computeBudgetConfig.limit, 0);
        }

        // Default is PRIORITY_FEE
        return createPriorityFeeTxn(this.connection, this.computeBudgetConfig, this.instructions);
    }

    private createVersionedTransaction(
        recentBlockhash: Blockhash,
        instructions: TransactionInstruction[],
        lookupTables?: AddressLookupTableAccount[]
    ): VersionedTransaction {
        return new VersionedTransaction(
            new TransactionMessage({
                payerKey: this.payerKey,
                recentBlockhash,
                instructions
            }).compileToV0Message(lookupTables || [])
        );
    }

    async build(): Promise<VersionedTransaction> {
        if (!this.payerKey || !this.connection) {
            throw new Error('Payer and connection must be set before building a transaction.');
        }

        if (!this.instructions || this.instructions.length === 0) {
            throw new Error('No instructions to build transaction with.');
        }

        // Create compute budget instructions
        const computeBudgetInstructions = await this.createComputeBudgetInstructions();
        const ixesWithComputeBudget = [...computeBudgetInstructions, ...this.instructions];

        // Simulate transaction to get actual compute units consumed
        const blockhash = (await this.connection.getLatestBlockhash(this.commitment)).blockhash;
        let transaction = this.createVersionedTransaction(
            blockhash,
            ixesWithComputeBudget,
            this.lookupTables
        );

        // Strip limit from tip transactions
        if (!this.stripLimit) {
            const simResult = await this.connection.simulateTransaction(transaction);
            if (simResult.value.err) {
                throw new SimulationError(
                    JSON.stringify(simResult.value.err),
                    transaction,
                    simResult.value.logs
                );
            }

            // Adjust compute limit unless specified
            if (this.computeBudgetConfig?.limit === undefined && simResult.value.unitsConsumed) {
                const actualUnitsConsumed = simResult.value.unitsConsumed;
                const actualUnitsConsumedWithBuffer = Math.ceil(actualUnitsConsumed * this.limitBuffer);
                ixesWithComputeBudget[0] = ComputeBudgetProgram.setComputeUnitLimit({
                    units: actualUnitsConsumedWithBuffer
                });

                transaction = this.createVersionedTransaction(
                    blockhash,
                    ixesWithComputeBudget,
                    this.lookupTables
                );
            }
        } else {
            transaction = this.createVersionedTransaction(
                blockhash,
                ixesWithComputeBudget.slice(1)
            );
        }

        return transaction;
    }
}
