import {
    Connection,
    VersionedTransaction,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';
import { JitoClient, Bundle } from '../solana-clients';
import { ComputeBudgetConfig, DEFAULT_CONFIG } from '../compute-budget';
import { MAX_SERIALIZED_LEN } from '../market-deployer/deployerBuilder';
import { TransactionBuilder } from '../transaction-builder';
import {
    createBundleCleanupInstruction,
    createBundleSetupInstruction,
    createValidateBundleInstruction
} from '../instructions';
import { Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { getAddressLookupTableAccounts } from '../utils';

// TipLocations:
// 'TX' - tip is appended as a separate transaction to the current payload
// 'IX' - tip is appended in the last transaction in the payload as an additional ix
// 'AUTO' - currently defaults to 'TX'
// 'NONE' - for 'validated' bundles

export type TipLocation = 'TX' | 'IX' | 'AUTO' | 'NONE';

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
    private tipLocation: TipLocation = 'NONE';
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

    addInstructions(...instructions: InstructionGroup[]): this {
        this.instructions.push(...instructions);
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
            case 'NONE':
                if (!this.reciprocal) {
                    throw new Error('Reciprocal must be set for validated bundles');
                }
                if (!this.instructions) {
                    throw new Error('No instructions to build validated bundle with');
                }

                transactions = await this.createStructuredTransactions();
                break;
            default:
                break;
        }

        const maxTransactionCount = this.numExpectedTxns || transactions.length;

        return {
            maxTransactionCount,
            transactions
        };
    }

    private async createStructuredTransactions(): Promise<VersionedTransaction[]> {
        const [tipAmount, tipAccount] = await this.client.getTipAmountAndAccount(
            this.computeBudgetConfig
        );

        const [bundleSetup, bundleCleanup, validateBundle, { blockhash }] = await Promise.all([
            createBundleSetupInstruction(
                this.program,
                {
                    payer: this.payer,
                    authority: this.authority
                },
                {
                    numExpectedTxns: this.numExpectedTxns,
                    reciprocal: this.reciprocal
                }
            ).then((ixes) => ixes.map((ix) => ({ ix }))),
            createBundleCleanupInstruction(
                this.program,
                {
                    payer: this.payer,
                    authority: this.authority,
                    reciprocal: this.reciprocal,
                    tipAccount
                },
                { tipAmount: BigInt(tipAmount) }
            ).then((ixes) => ixes.map((ix) => ({ ix }))),
            createValidateBundleInstruction(this.program, {
                payer: this.payer,
                authority: this.authority
            }).then((ixes) => ixes.map((ix) => ({ ix }))),
            this.program.provider.connection.getLatestBlockhash()
        ]);

        this.instructions[0].ixes = bundleSetup.map(item => item.ix).concat(this.instructions[0].ixes);
        this.instructions[this.instructions.length - 1].ixes =
            this.instructions[this.instructions.length - 1].ixes.concat(bundleCleanup.map(item => item.ix));

        if (this.instructions.length > 2) {
            for (let i = 1; i < this.instructions.length - 1; i++) {
                this.instructions[i].ixes = this.instructions[i].ixes.concat(validateBundle.map(item => item.ix));
            }
        }

        // Fetch all unique luts in one call instead of per group
        const uniqueLuts = Array.from(new Set(
            this.instructions
                .filter(group => group.luts && group.luts.length > 0)
                .flatMap(group => group.luts || [])
        ));

        const addrIdxMap = new Map();
        uniqueLuts.forEach((address, index) => {
            addrIdxMap.set(address, index);
        });

        let lutAccounts = [];
        if (uniqueLuts.length > 0) {
            lutAccounts = await getAddressLookupTableAccounts(this.program.provider.connection, uniqueLuts);
        }

        const txnBuilders = await Promise.all(
            this.instructions.map(async (group, i) => {

                const builder = new TransactionBuilder()
                    .setPayer(this.payer)
                    .setConnection(this.program.provider.connection)
                    .setComputeBudgetConfig(this.computeBudgetConfig)
                    .setRecentBlockhash(blockhash)
                    .setStripLimitIx(i > 0);

                builder.addInstructions(...group.ixes);

                if (group.luts && group.luts.length > 0) {
                    const groupLuts = group.luts.map(address =>
                        lutAccounts[addrIdxMap.get(address)]
                    );

                    if (groupLuts) {
                        builder.addLookupTables(...groupLuts);
                    }
                }

                return builder;
            })
        );

        return await Promise.all(txnBuilders.map(builder => builder.build()));

    }

}
