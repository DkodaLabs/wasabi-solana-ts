import {
    Connection,
    VersionedTransaction,
    PublicKey,
    TransactionInstruction,
    AddressLookupTableAccount
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

// TipLocations:
// 'TX' - tip is appended as a separate transaction to the current payload
// 'IX' - tip is appended in the last transaction in the payload as an additional ix
// 'AUTO' - currently defaults to 'TX'
// 'NONE' - for 'validated' bundles

export type TipLocation = 'TX' | 'IX' | 'AUTO' | 'NONE';

interface IxLut {
    ix: TransactionInstruction;
    lut?: AddressLookupTableAccount;
}

export class BundleBuilder {
    private client!: JitoClient;
    private program?: Program<WasabiSolana>;
    private connection?: Connection;
    private payer: PublicKey;
    private authority?: PublicKey;
    private transactions?: VersionedTransaction[] = [];
    private instructions?: IxLut[][] = [];
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

    addInstructions(...instructions: IxLut[]): this {
        this.instructions.push(instructions);
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

        const composedIxlut = [...this.instructions];
        composedIxlut[0] = [...bundleSetup, ...composedIxlut[0]];
        composedIxlut[composedIxlut.length - 1] = [
            ...bundleCleanup,
            ...composedIxlut[composedIxlut.length - 1]
        ];

        for (let i = 1; i < composedIxlut.length - 2; i++) {
            composedIxlut[i].push(...validateBundle);
        }

        return Promise.all(
            composedIxlut.map((ixes, i) => {
                const builder = new TransactionBuilder()
                    .setPayer(this.payer)
                    .setConnection(this.program.provider.connection)
                    .setComputeBudgetConfig(this.computeBudgetConfig)
                    .setRecentBlockhash(blockhash)
                    .setStripLimitIx(i > 0);

                ixes.forEach(({ ix, lut }) => {
                    builder.addInstructions(ix);
                    if (lut) builder.addLookupTables(lut);
                });

                return builder.build();
            })
        );
    }
}

// Slowest - will optimally fit instructions within transactions (gets as close to the size limit as possible)
// Caveat - we have can't know how many transaction there are. Thus, we make an assumption of two (2) as our current
// instruction set will always fit into two (2) transactions.
// NOTE: We can safely make an assumption that the first two (2) instructions in the payload will always
// fit into the first transaction. (`bundle_setup` and `init_ata`/`xyz_setup`)
//export const createOptimizedTransactions = async (
//    payerKey: PublicKey,
//    authority: PublicKey,
//    program: Program<WasabiSolana>,
//    jito: JitoClient,
//    ixlut: IxLut[],
//    computeBudget: ComputeBudgetConfig
//): Promise<VersionedTransaction[]> => {
//    const txns: VersionedTransaction[] = [];
//
//    const tipAmount = jito.getTipAmount(computeBudget);
//    const bundleSetup = (await createBundleSetupInstruction()).map((ix) => <IxLut>{ ix });
//    const bundleCleanup = (await createBundleCleanupInstruction(tipAmount)).map(
//        (ix) => <IxLut>{ ix }
//    );
//    const validateBundle = await createValidateBundleInstruction();
//
//    ixlut = { ...bundleSetup, ...ixlut, ...bundleCleanup };
//
//    let lastValidTxn: VersionedTransaction | undefined;
//
//    const builder = new TransactionBuilder()
//        .setPayer(payerKey)
//        .setConnection(program.provider.connection)
//        .setComputeBudgetConfig(computeBudget)
//        .setRecentBlockhash((await program.provider.connection.getLatestBlockhash()).blockhash);
//
//    for (let i = 0; i < ixlut.length; i++) {
//        builder.addInstructions(ixlut[i].ix);
//        builder.addLookupTables(ixlut[i].lut);
//
//        // In a validated bundle, the last ix should always be the `bundle_cleanup` ix
//        // Bundle validation is not required since the cleanup also performs this logic
//        // Bundle validation will always be the 2nd instruction in intermediate bundles after
//        // a zeroed out compute price ix.
//        if (i === ixlut.length - 1) {
//            const instructions = builder.getInstructions();
//            builder.setInstructions(instructions.slice(0, 2).concat(instructions.slice(3)));
//        }
//
//        if (txns.length > 0) {
//            builder.setStripLimitIx(true);
//        }
//
//        const txn = await builder.build();
//
//        if (txn.serialize().length >= MAX_SERIALIZED_LEN) {
//            if (!lastValidTxn)
//                throw new Error('The first instruction is too large to fit in a transaction');
//            txns.push(lastValidTxn);
//            lastValidTxn = undefined;
//            builder.setInstructions([...validateBundle, ixlut[i].ix]);
//            builder.setLookupTables([ixlut[i].lut]);
//        } else {
//            lastValidTxn = txn;
//        }
//    }
//
//    if (lastValidTxn) {
//        txns.push(lastValidTxn);
//    }
//
//    return txns;
//};
