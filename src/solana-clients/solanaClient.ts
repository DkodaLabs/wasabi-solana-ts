import { Connection, VersionedTransaction } from '@solana/web3.js';

export interface SolanaClient {
    sendTransactions(transactions: VersionedTransaction[]): Promise<string>;
}

export class SolanaRpcClient implements SolanaClient {
    constructor(private readonly connection: Connection) {}

    async sendTransactions(transactions: VersionedTransaction[]): Promise<string> {
        if (transactions.length > 1) {
            throw new Error('SolanaRpcClient only supports sending one transaction at a time');
        }

        return await this.connection.sendTransaction(transactions[0], { skipPreflight: true });
    }
}
