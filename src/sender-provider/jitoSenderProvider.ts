import { searcher } from 'jito-ts';
import {
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    Connection
} from '@solana/web3.js';
import { Bundle } from 'jito-ts/dist/sdk/block-engine/types';
import { ProviderOptions, Sender } from '../index';

const DEFAULT_JITO_URL = 'https://api.jito.xyz';

// A tip transaction is ~212 bytes
export const createTipTransaction = async (
    connection: Connection,
    payer: PublicKey,
    options: ProviderOptions,
): Promise<VersionedTransaction> => {
    const [{ blockhash }, tipIx] = await Promise.all([
        connection.getLatestBlockhash(),
        createTipInstruction(options, payer)
    ]);

    const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions: [tipIx]
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
};

// A tip instruction is ~108 bytes
export const createTipInstruction = async (
    options: ProviderOptions,
    payer: PublicKey
): Promise<TransactionInstruction> => {
    if (!options.searcherClient) {
        options.searcherClient = searcher.searcherClient(DEFAULT_JITO_URL);
    }
    const tipAccounts = await options.searcherClient
        .getTipAccounts()
        .then((res) => (res.ok ? res.value : Promise.reject('Failed to retrieve tip accounts')));
    const tipAccount = new PublicKey(tipAccounts[Math.floor(Math.random() * tipAccounts.length)]);

    return SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: tipAccount,
        lamports: options.tipAmount
    });
};

// Returns lamports NOT micro-lamports
export const getTipAmountFromPriorityFee = (transaction: VersionedTransaction): bigint => {
    const instructions = transaction.message.compiledInstructions;
    const computeLimit = new DataView(instructions[0].data.buffer).getUint32(1, true);
    const computePrice = new DataView(instructions[1].data.buffer).getBigUint64(1, true);
    return (BigInt(computeLimit) * computePrice) / BigInt(1000);
};

//private async getTipAmountFromRpc(): bigint {
//
//}


export const jitoSender =
    (connection: Connection) =>
    async (transactions: VersionedTransaction[]): Promise<Sender> => {
        const newSearcherClient = (url?: string) => {
            return searcher.searcherClient(url || DEFAULT_JITO_URL);
        };

        const sendTx = async (transaction: VersionedTransaction): Promise<string> => {
            return connection.sendTransaction(transaction, { skipPreflight: true });
        };

        const sendBundle = async (txs: VersionedTransaction[]): Promise<string> => {
            try {
                let isLeaderSlot = false;
                const searcherClient = newSearcherClient();
                while (!isLeaderSlot) {
                    const nextLeader = await searcherClient.getNextScheduledLeader();

                    if (!nextLeader.ok) {
                        throw new Error('Failed to get next leader');
                    }

                    const numSlots = nextLeader.value.nextLeaderSlot - nextLeader.value.currentSlot;
                    isLeaderSlot = numSlots <= 2;
                    await new Promise((r) => setTimeout(r, 500));
                }

                const bundle = new Bundle(txs, txs.length);
                const result = await searcherClient.sendBundle(bundle);

                if (!result.ok) {
                    throw new Error('Failed to send bundle');
                }

                return result.value;
            } catch (e: any) {
                throw e;
            }
        };

        return {
            send: async (): Promise<string> => {
                try {
                    if (transactions.length > 1) {
                        return sendBundle(transactions);
                    }

                    return sendTx(transactions[0]);
                } catch (e: any) {
                    throw new Error('Failed to send transaction(s)');
                }
            }
        };
    };
