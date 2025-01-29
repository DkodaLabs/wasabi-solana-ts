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
import { SimulationError } from '../error-handling';


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
            this.computeBudgetConfig = {
                type: 'FIXED',
                price: 0,
                limit: 0,
            };
            return await createComputeBudgetIx(this.connection, this.computeBudgetConfig, this.instructions);
        }
        return createComputeBudgetIx(this.connection, this.computeBudgetConfig, this.instructions);
    }

    private adjustComputeLimit(
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

            this.instructions[0] = ComputeBudgetProgram.setComputeUnitLimit({ units: adjustedLimit });
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
            throw new SimulationError(JSON.stringify(simResult.value.err), transaction, simResult.value.logs);
        }

        let ixEdited = false;

        const destination = this.computeBudgetConfig.destination ?? 'PRIORITY_FEE';
        if (destination === 'JITO') {
            // removes the priority fee
            this.instructions[1] = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0 });
            ixEdited = true;
        }

        if (simResult.value.unitsConsumed && !this.computeBudgetConfig.limit) {
            const actualUnitsConsumed = simResult.value.unitsConsumed;
            this.adjustComputeLimit(this.computeBudgetConfig.limit || 0, actualUnitsConsumed);
            ixEdited = true;
        }

        if (ixEdited) {
            transaction = new VersionedTransaction(
                new TransactionMessage({
                    payerKey: this.payerKey,
                    recentBlockhash: blockhash,
                    instructions: this.instructions
                }).compileToV0Message(this.lookupTables)
            );
        }

        return transaction;
    }
}
