import {
    Connection,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    VersionedTransaction
} from '@solana/web3.js';
import { SolanaClient } from './solanaClient';

export const NOZOMI_TIP_ACCOUNTS = [
    'TEMPaMeCRFAS9EKF53Jd6KpHxgL47uWLcpFArU1Fanq',
    'noz3jAjPiHuBPqiSPkkugaJDkJscPuRhYnSpbi8UvC4',
    'noz3str9KXfpKknefHji8L1mPgimezaiUyCHYMDv1GE',
    'noz6uoYCDijhu1V7cutCpwxNiSovEwLdRHPwmgCGDNo',
    'noz9EPNcT7WH6Sou3sr3GGjHQYVkN3DNirpbvDkv9YJ',
    'nozc5yT15LazbLTFVZzoNZCwjh3yUtW86LoUyqsBu4L',
    'nozFrhfnNGoyqwVuwPAW4aaGqempx4PU6g6D9CJMv7Z',
    'nozievPk7HyK1Rqy1MPJwVQ7qQg2QoJGyP71oeDwbsu',
    'noznbgwYnBLDHu8wcQVCEw6kDrXkPdKkydGJGNXGvL7',
    'nozNVWs5N8mgzuD3qigrCG2UoKxZttxzZ85pvAQVrbP',
    'nozpEGbwx4BcGp6pvEdAh1JoC2CQGZdU6HbNP1v2p6P',
    'nozrhjhkCr3zXT3BiT4WCodYCUFeQvcdUkM7MqhKqge',
    'nozrwQtWhEdrA6W8dkbt9gnUaMs52PdAv5byipnadq3',
    'nozUacTVWub3cL4mJmGCYjKZTnE9RbdY5AP46iQgbPJ',
    'nozWCyTPppJjRuw2fpzDhhWbW355fzosWSzrrMYB1Qk',
    'nozWNju6dY353eMkMqURqwQEoM3SFgEKC6psLCSfUne',
    'nozxNBgWohjR75vdspfxR5H9ceC7XXH99xpxhVGt3Bb'
];

export class NozomiClient implements SolanaClient {
    static MIN_TIP_AMOUNT = 1_000_000;

    constructor(private readonly connection: Connection) { }

    async sendTransactions(transactions: VersionedTransaction[]): Promise<string> {
        if (transactions.length > 1) {
            throw new Error('NozomiClient currently only supports sending one transaction at a time');
        }

        return await this.connection.sendTransaction(transactions[0], { skipPreflight: true });
    }

    static prepareInstructions(instructions: TransactionInstruction[], payer: PublicKey): TransactionInstruction[] {
        const tipIx = SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: NozomiClient.getRandomTipAccount(),
            lamports: NozomiClient.MIN_TIP_AMOUNT,

        })
        return [...instructions, tipIx];
    }

    static getRandomTipAccount(): PublicKey {
        return new PublicKey(NOZOMI_TIP_ACCOUNTS[Math.floor(Math.random() * NOZOMI_TIP_ACCOUNTS.length)]);
    }
}