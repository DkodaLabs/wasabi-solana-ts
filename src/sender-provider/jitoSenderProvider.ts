import { VersionedTransaction, Connection } from '@solana/web3.js';
import { Sender } from '../index';
import { DEFAULT_JITO_URL, JitoClient } from './jitoTypes';


export const createJitoClient = async (url?: string, uuid?: string): Promise<JitoClient> => {
    if (typeof window === 'undefined') {
        const { createServerClient } = await import('./jitoServer');
        return createServerClient(url || DEFAULT_JITO_URL);
    } else {
        const { createBrowserClient } = await import('./jitoBrowser');
        return createBrowserClient(url || DEFAULT_JITO_URL);
    }
};

export const jitoSender =
    (
        connection: Connection,
        providerClient: JitoClient,
        confirm: boolean = false
    ) => async (transactions: VersionedTransaction[]): Promise<Sender> => {
        const sendTx = async (): Promise<string> => {
            return connection.sendTransaction(transactions[0], { skipPreflight: true });
        };

        const sendBundle = async (): Promise<string> => {
            try {
                const response = await providerClient.sendBundle(transactions);
                if (confirm) {
                    await providerClient.confirmBundle(response);
                }

                return response;
            } catch (e: any) {
                throw e;
            }
        };

        return {
            transactions,
            send: async (): Promise<string> => {
                try {
                    if (transactions.length > 1) {
                        return sendBundle();
                    }

                    return sendTx();
                } catch (e: any) {
                    throw new Error('Failed to send transaction(s)');
                }
            }
        };
    };
