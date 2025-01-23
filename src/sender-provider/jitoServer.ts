import { VersionedTransaction } from '@solana/web3.js';
import { JitoClient } from './jitoTypes';

export const createServerClient = async (url: string): Promise<JitoClient> => {
    const { searcher } = await import('jito-ts');
    const { Bundle } = await import('jito-ts/dist/sdk/block-engine/types');
    const client = searcher.searcherClient(url);

    return {
        sendBundle: async (transactions: VersionedTransaction[]): Promise<string> => {
            try {
                const response = await client.sendBundle(
                    new Bundle(transactions, transactions.length)
                );
                if (response.ok) {
                    return response.value;
                }
                throw new Error('Failed to send bundle');
            } catch (e: any) {
                throw e;
            }
        },

        confirmBundle: async (bundleId: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const cancelStream = client.onBundleResult(
                    (result) => {
                        if (result.bundleId === bundleId) {
                            console.log('Bundle :', result);
                            cancelStream();
                            resolve();
                        }
                    },
                    (error) => {
                        cancelStream();
                        reject(error);
                    }
                );

                // Timeout after 30 seconds
                setTimeout(() => {
                    cancelStream();
                    reject(new Error('Bundle confirmation timed out'));
                }, 30000);
            });
        },
    };
};
