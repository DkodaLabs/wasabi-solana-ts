import {
    Connection,
    VersionedTransaction,
} from '@solana/web3.js';

export interface SolanaClient {
    sendTransactions(transactions: VersionedTransaction[]): Promise<string>;
    confirmTransactions(bundleId: string): Promise<void>;
}

export class SolanaRpcClient implements SolanaClient {

    constructor(private readonly connection: Connection) { }

    async sendTransactions(transactions: VersionedTransaction[]): Promise<string> {
        if (transactions.length > 1) {
            throw new Error("SolanaRpcClient only supports sending one transaction at a time");
        }

        return await this.connection.sendTransaction(transactions[0], { skipPreflight: true });
    }

    async confirmTransactions(signature: string): Promise<void> {
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
        const result = await this.connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        },
            'confirmed'
        );
        if (result.value.err) {
            throw result.value.err;
        }
        return;
    }
}
