import { JitoJsonRpcClient } from 'jito-js-rpc';
import { JitoClient, UUID } from './jitoTypes';
import {
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  TransactionInstruction,
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


    }
  };
};
