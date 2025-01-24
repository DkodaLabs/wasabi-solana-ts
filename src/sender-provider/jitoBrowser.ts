import { JitoJsonRpcClient } from 'jito-js-rpc';
import { JitoClient, UUID } from './jitoTypes';
import {
    VersionedTransaction,
} from '@solana/web3.js';

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

            if (result.err) {
                throw new Error(result.err);
            }

            return;
        },
    }
};
