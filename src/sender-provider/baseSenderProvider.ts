import { Connection, VersionedTransaction, Keypair, PublicKey } from '@solana/web3.js';
import { searcher } from 'jito-ts';
import { createTipTransaction, jitoSender } from './jitoSenderProvider';

export interface Sender {
    send: () => Promise<string>;
}

export interface ProviderOptions {
    searcherClient?: searcher.SearcherClient;
    tipAmount?: bigint;
    transactionLimit?: number;
}

export type TransactionSigner = {
    signTransaction?: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
} | Keypair;

export const baseSender =
    (connection: Connection) =>
    async (transactions: VersionedTransaction[]): Promise<Sender> => {
        const sendTx = async (transactions: VersionedTransaction[]): Promise<string> => {
            if (transactions.length > 1) {
                throw new Error('Base sender only supports one transaction');
            }

            return await connection.sendTransaction(transactions[0]);
        };

        return {
            send: async (): Promise<string> => {
                return await sendTx(transactions);
            }
        };
    };

export class ProviderBuilder {
    private connection: Connection;
    private payer: PublicKey;
    private simulateTransaction: boolean;
    private confirmTransaction: boolean;
    private options: ProviderOptions;

    private transactions: VersionedTransaction[] = [];

    setConnection(connection: Connection): this {
        this.connection = connection;
        return this;
    }

    setSimulateTransaction(simulateTransaction: boolean): this {
        this.simulateTransaction = simulateTransaction;
        return this;
    }

    setConfirmTransaction(confirmTransaction: boolean): this {
        this.confirmTransaction = confirmTransaction;
        return this;
    }

    setOptions(options: ProviderOptions): this {
        this.options = options;
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

    addSerializedTransactions(...transaction: string[]): this {
        this.transactions.push(
            ...transaction.map((tx) => VersionedTransaction.deserialize(Buffer.from(tx, 'base64')))
        );

        return this;
    }

    setSerializedTransactions(transactions: string[]): this {
        this.transactions = transactions.map((tx) =>
            VersionedTransaction.deserialize(Buffer.from(tx, 'base64'))
        );

        return this;
    }

    setProviderOptions(options: ProviderOptions): this {
        this.options = options;
        return this;
    }

    async getSender(): Promise<Sender> {
        if (this.options) {
            return jitoSender(this.connection)(this.transactions);
        }

        return baseSender(this.connection)(this.transactions);
    }

    async sign(transactions: VersionedTransaction[], signer: TransactionSigner): Promise<this> {
        for (const transaction of transactions) {
            if ('signTransaction' in signer && signer.signTransaction) {
                await signer.signTransaction(transaction);
            } else if (signer instanceof Keypair) {
                transaction.sign([signer]);
            } else {
                throw new Error('Invalid signer');
            }
        }

        return this;
    }

    protected async simulate(transactions: Array<VersionedTransaction>): Promise<void> {
        const simPromises = transactions.map((tx) => {
            return this.connection.simulateTransaction(tx, { commitment: 'confirmed' });
        });
        const simResults = await Promise.all([...simPromises]);

        for (const simResult of simResults) {
            if (simResult.value.err) {
                throw new Error(
                    'Failed to simulate transaction: ' + simResult.value.err.toString() + ''
                );
            }
        }

        return;
    }

    private validateSignatures(): void {
        for (const transaction of this.transactions) {
            if (!transaction.signatures.length) {
                throw new Error('Transaction has no signatures');
            }

            const message = transaction.message;
            const feePayerPubkey = message.staticAccountKeys[0];
            if (!feePayerPubkey.equals(this.payer)) {
                throw new Error('Fee payer public key mismatch');
            }
        }

        return;
    }

    async prepare(): Promise<this> {
        this.validateSignatures();
        this.simulateTransaction && (await this.simulate(this.transactions));
        if (this.options?.searcherClient) {
            this.transactions.push(
                await createTipTransaction(this.connection, this.payer, this.options)
            );
        }
        return this;
    }

    private validateSignedTransactions(): void {
        for (const transaction of this.transactions) {
            const message = transaction.message;
            if (transaction.signatures.length < message.header.numRequiredSignatures) {
                throw new Error(
                    `Transaction requires ${message.header.numRequiredSignatures} signatures but only has ${transaction.signatures.length}`
                );
            }

            if (!transaction.signatures[0]) {
                throw new Error('Fee payer is missing');
            }
        }

        return;
    }

    async build(): Promise<Sender> {
        this.validateSignedTransactions();
        return this.getSender();
    }
}
