import { VersionedTransaction, Connection } from '@solana/web3.js';
import { Sender } from '../index';
import { JITO_BASE_URL, JITO_RPC_URL, JitoClient, } from './jitoTypes';


export const createJitoClient = async (url?: string, uuid?: string): Promise<JitoClient> => {
    if (typeof window === 'undefined') {
        const { createServerClient } = await import('./jitoServer');
        return createServerClient(url || JITO_BASE_URL);
    } else {
        const { createBrowserClient } = await import('./jitoBrowser');
        return createBrowserClient(url || JITO_RPC_URL);
    }
};

export const jitoSender =
    (
        _connection: Connection,
        providerClient: JitoClient,
        confirm: boolean = false
    ) => async (transactions: VersionedTransaction[]): Promise<Sender> => {
        // To send transactions only to the Jito block-engine
        //const sendTx = async (): Promise<string> => {
        //    return connection.sendTransaction(transactions[0], { skipPreflight: true });
        //};

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
                    return sendBundle();
                    // return sendTx();
                } catch (e: any) {
                    throw new Error('Failed to send transaction(s)');
                }
            }
        };
    };
