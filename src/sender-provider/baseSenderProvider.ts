import {
    Connection,
    VersionedTransaction,
    Keypair,
    PublicKey,
    TransactionConfirmationStrategy,
    Transaction,
    Signer,
} from '@solana/web3.js';
import { jitoSender } from './jitoSenderProvider';
import { JitoClient } from './jitoTypes';
import { createTipInstruction } from './jitoTips';
import { TransactionBuilder } from '../transaction-builder';

export interface Sender {
    transactions: VersionedTransaction[];
    send: () => Promise<string>;
}

export interface ProviderOptions {
    tipAmount?: number;
    transactionLimit?: number;
}

export type TransactionSigner = {
    signTransaction?: ((transaction: VersionedTransaction) => Promise<VersionedTransaction>)
        | (<T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>);
    signAllTransactions?: ((transactions: VersionedTransaction[]) => Promise<VersionedTransaction[]>)
    | (<T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T>);
} | Keypair | Signer;

export const baseSender = (connection: Connection, confirm: boolean = false) =>
    async (transactions: VersionedTransaction[]): Promise<Sender> => {
        const sendTx = async (transactions: VersionedTransaction[]): Promise<string> => {
            if (transactions.length > 1) {
                throw new Error('Base sender only supports one transaction');
            }

            const signature = await connection.sendTransaction(transactions[0], { skipPreflight: true });

            if (confirm) {
                const confirmStrategy: TransactionConfirmationStrategy = {
                    signature,
                    blockhash: transactions[0].message.recentBlockhash,
                    lastValidBlockHeight: await connection.getBlockHeight()
                };
                const status = await connection.confirmTransaction(confirmStrategy);
                if (status.value.err) {
                    throw new Error('Transaction failed: ' + status.value.err.toString());
                }
            }

            return signature;
        };

        return {
            transactions,
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
    private providerClient?: JitoClient;
    private options: ProviderOptions;

    private transactions: VersionedTransaction[] = [];

    setConnection(connection: Connection): this {
        this.connection = connection;
        return this;
    }

    setPayer(payer: PublicKey): this {
        this.payer = payer;
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

    setProviderClient(providerClient: JitoClient): this {
        this.providerClient = providerClient;
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

    getTransactions(): VersionedTransaction[] {
        return this.transactions;
    }

    private async getSender(): Promise<Sender> {
        if (this.providerClient) {
            return jitoSender(this.connection, this.providerClient, this.confirmTransaction)(this.transactions);
        }

        return baseSender(this.connection, this.confirmTransaction)(this.transactions);
    }

    async sign(transactions: VersionedTransaction[], signer: TransactionSigner): Promise<this> {
        console.log('signer', signer);
        if ('signAllTransactions' in signer && signer.signAllTransactions) {
            this.transactions = await signer.signAllTransactions(transactions) as VersionedTransaction[];
        } else {
            for (const transaction of transactions) {
                if ('signTransaction' in signer && signer.signTransaction) {
                    const txPromises = transactions.map(tx => signer.signTransaction(tx));
                    this.transactions = await Promise.all([...txPromises]) as VersionedTransaction[];
                } else if (signer instanceof Keypair) {
                    transaction.sign([signer]);
                } else if ('secretKey' in signer) {
                    const keypair = Keypair.fromSecretKey(signer.secretKey);
                    transaction.sign([keypair]);
                }else {
                    throw new Error('Invalid signer');
                }
            }
        }

        return this;
    }

    private async simulate(transactions: VersionedTransaction[]): Promise<void> {
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

    async build(signer: TransactionSigner): Promise<Sender> {
        // Validate signature length
        this.validateSignatures();

        // Simulate
        this.simulateTransaction && (await this.simulate(this.transactions));

        // Add the tip instruction
        if (this.providerClient && this.options?.tipAmount) {
            const tipIx = createTipInstruction(this.payer, this.options.tipAmount);

            const builder = new TransactionBuilder()
                .setPayer(this.payer)
                .setConnection(this.connection)
                .addInstructions(tipIx);

            const tx = await builder.build();

            this.transactions.push(tx);
        }

        await this.sign(this.transactions, signer);

        this.validateSignedTransactions();

        return this.getSender();
    }
}
