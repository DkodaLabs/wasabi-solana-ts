import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { JitoClient, Bundle } from '../solana-clients';
import { ComputeBudgetConfig, DEFAULT_CONFIG } from '../compute-budget';

export type TipLocation = 'TX' | 'IX' | 'AUTO' | 'NONE';

export class BundleBuilder {
    private client!: JitoClient;
    private connection: Connection;
    private payer: PublicKey;
    private transactions: VersionedTransaction[] = [];
    private maxTransactionCount: number = 0;
    private computeBudgetConfig: ComputeBudgetConfig = DEFAULT_CONFIG;
    private tipLocation: TipLocation = 'AUTO';

    setClient(client: JitoClient): this {
        this.client = client;
        return this;
    }

    setConnection(connection: Connection): this {
        this.connection = connection;
        return this;
    }

    setPayer(payer: PublicKey): this {
        this.payer = payer;
        return this;
    }

    addTransactions(...transactions: VersionedTransaction[]): this {
        this.transactions.push(...transactions);
        return this;
    }

    setMaxTransactionCount(maxTransactionCount: number): this {
        this.maxTransactionCount = maxTransactionCount;
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

        const maxTransactionCount = this.maxTransactionCount || this.transactions.length;

        let transactions: VersionedTransaction[] = this.transactions;
        switch (this.tipLocation) {
            case 'AUTO':
            case 'TX':
                transactions = await this.client.appendTipTransaction(
                    this.connection,
                    this.payer,
                    this.computeBudgetConfig,
                    this.transactions
                );
                break;
            case 'IX':
                transactions = await this.client.appendTipInstruction(
                    this.connection,
                    this.payer,
                    this.computeBudgetConfig,
                    this.transactions
                );
                break;
            default:
                break;
        }

        return {
            maxTransactionCount,
            transactions,
        };

    }
}
