import {
    Connection,
    VersionedTransaction,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';
import { JitoClient, Bundle } from '../solana-clients';
import { ComputeBudgetConfig, DEFAULT_CONFIG } from '../compute-budget';
import { MAX_SERIALIZED_LEN } from '../market-deployer/deployerBuilder';
import { Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';

// TipLocations:
// 'TX' - tip is appended as a separate transaction to the current payload
// 'IX' - tip is appended in the last transaction in the payload as an additional ix
// 'AUTO' - currently defaults to 'TX'

export type TipLocation = 'TX' | 'IX' | 'AUTO';

export type InstructionGroup = {
    ixes: TransactionInstruction[],
    luts?: string[],
}

export class BundleBuilder {
    private client!: JitoClient;
    private program?: Program<WasabiSolana>;
    private connection?: Connection;
    private payer: PublicKey;
    private authority?: PublicKey;
    private transactions?: VersionedTransaction[] = [];
    private instructions?: InstructionGroup[] = [];
    private numExpectedTxns: number = 0;
    private computeBudgetConfig: ComputeBudgetConfig = DEFAULT_CONFIG;
    private tipLocation: TipLocation = 'IX';
    private reciprocal?: PublicKey;

    setClient(client: JitoClient): this {
        this.client = client;
        return this;
    }

    setConnection(connection: Connection): this {
        this.connection = connection;
        return this;
    }

    private getConnection(): Connection {
        return this.connection || this.program.provider.connection;
    }

    setProgram(program: Program<WasabiSolana>): this {
        this.program = program;
        return this;
    }

    setPayer(payer: PublicKey): this {
        this.payer = payer;
        return this;
    }

    setAuthority(authority: PublicKey): this {
        this.authority = authority;
        return this;
    }

    addTransactions(...transactions: VersionedTransaction[]): this {
        this.transactions.push(...transactions);
        return this;
    }
    
    setTransactions(transactions: VersionedTransaction[]): this {
        this.transactions = transactions;
        return this;
    }

    addInstructions(...instructions: InstructionGroup[]): this {
        this.instructions.push(...instructions);
        return this;
    }
    
    setInstructions(instructions: InstructionGroup[]): this {
        this.instructions = instructions;
        return this;
    }

    setMaxTransactionCount(maxTransactionCount: number): this {
        this.numExpectedTxns = maxTransactionCount;
        return this;
    }

    setComputeBudgetConfig(computeBudgetConfig: ComputeBudgetConfig): this {
        this.computeBudgetConfig = computeBudgetConfig;
        return this;
    }

    setTipLocation(tipLocation: TipLocation): this {
        this.tipLocation = tipLocation;
        return this;
    }

    async build(): Promise<Bundle> {
        if (!this.payer || !this.connection || !this.client) {
            throw new Error('Payer, connection, and client must be set before building a bundle');
        }

        if (!this.transactions || this.transactions.length === 0) {
            throw new Error('No transactions to build bundle with');
        }

        if (this.transactions.length > 5) {
            throw new Error('Bundles may only contain five (5) transactions');
        }

        let transactions: VersionedTransaction[] = this.transactions;
        switch (this.tipLocation) {
            case 'AUTO':
            case 'TX':
                transactions = await this.client.appendTipTransaction(
                    this.getConnection(),
                    this.payer,
                    this.computeBudgetConfig,
                    this.transactions
                );

                break;
            case 'IX':
                if (
                    this.transactions[this.transactions.length - 1].serialize().length <=
                    MAX_SERIALIZED_LEN - 24 // Compute budget ixes require ~24bytes
                ) {
                    transactions = await this.client.appendTipInstruction(
                        this.connection,
                        this.payer,
                        this.computeBudgetConfig,
                        this.transactions
                    );
                } else if (this.transactions.length < 5) {
                    transactions = await this.client.appendTipTransaction(
                        this.getConnection(),
                        this.payer,
                        this.computeBudgetConfig,
                        this.transactions
                    );
                } else {
                    throw new Error('No space to append tip instruction or transaction');
                }

                break;
            default:
                break;
        }

        const maxTransactionCount = this.numExpectedTxns || transactions.length;
        console.log(transactions);

        return {
            maxTransactionCount,
            transactions
        };
    }
}
