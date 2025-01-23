import { JitoJsonRpcClient } from 'jito-js-rpc';
import { JitoClient, UUID } from './jitoTypes';
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js';
import { getRandomTipAccount } from './jitoTipAccounts';

export const createBrowserClient = async (url: string): Promise<JitoClient> => {
  const client = new JitoJsonRpcClient(url, UUID);

  return {
    sendBundle: async (transactions: VersionedTransaction[]): Promise<string> => {
      try {
        const base64Txs = [
          ...new Set(
            transactions.map((tx) => {
              return Buffer.from(tx.serialize()).toString('base64');
            })
          )
        ];
        const response = await client.sendBundle([base64Txs, { encoding: 'base64' }]);

        return response.result;
      } catch (e: any) {
        throw e;
      }
    },

    confirmBundle: async (bundleId: string): Promise<void> => {
      const result = await client.confirmInflightBundle(bundleId);
      console.log(result);
    },

    // NOTE: Probably want to use the transaction builder to build this
    // to so we aren't passing the connection into this function
    //
    // A tip transaction is ~220 bytes (rough estimation 64 bytes for signature + 1 for length prefix)
    // A tip instruction is ~150 bytes (exactly 152 bytes)
    createTipTransaction: async (
      connection: Connection,
      payer: PublicKey,
      tipAmount: number
    ): Promise<VersionedTransaction> => {
      const { blockhash } = await connection.getLatestBlockhash();

      const tipIx = SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: getRandomTipAccount(),
        lamports: tipAmount
      });

      const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions: [tipIx]
      }).compileToV0Message();

      return new VersionedTransaction(messageV0);
    }
  };
};
