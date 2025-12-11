import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';

import NodeCache from 'node-cache';

/**
 * Base class for account caches
 *
 * @template T - The type of the parsed accounts
 */
export abstract class BaseAccountCache<T> {
    protected readonly cache: NodeCache;

    /**
     * Create a new account cache
     *
     * @param connection - The connection to use
     * @param options - The options for the cache
     */
    constructor(protected readonly connection: Connection, options?: NodeCache.Options) {
        this.cache = new NodeCache(options);
    }
    
    /**
     * Get multiple accounts from the cache or the connection and parse them
     *
     * @param addresses - The addresses of the accounts to get
     * @returns A map of the addresses to the parsed accounts
     */
    public async getAccountsStr(addresses: string[]): Promise<Map<string, T>> {
        return this.getAccounts(addresses.map(addr => new PublicKey(addr)));
    }

    /**
     * Get multiple accounts from the cache or the connection and parse them
     *
     * @param addresses - The addresses of the accounts to get
     * @returns A map of the addresses to the parsed accounts
     */
    public async getAccounts(addresses: PublicKey[]): Promise<Map<string, T>> {
        const result = new Map<string, T>();
        const missingAddresses = new Set<PublicKey>();

        for (const address of addresses) {
            const cachedAccount = this.cache.get<T>(address.toString());
            if (cachedAccount) {
                result.set(address.toString(), cachedAccount);
            } else {
                missingAddresses.add(address);
            }
        }

        if (missingAddresses.size > 0) {
            const missingAddressesArray = Array.from(missingAddresses); 
            const accounts = await this.connection.getMultipleAccountsInfo(missingAddressesArray);
            for (let i = 0; i < accounts.length; i++) {
                const account = accounts[i];
                const address = missingAddressesArray[i];
                if (account) {
                    const parsedAccount = this.parseAccount(account);

                    result.set(address.toString(), parsedAccount);
                    this.cache.set(address.toString(), parsedAccount);
                }
            }
        }
        return result;
    }

    /**
     * Get a single account from the cache or the connection and parse it
     *
     * @param address - The address of the account to get
     * @returns The parsed account
     */
    public async getAccount(address: PublicKey): Promise<T> {
        const result = await this.getAccounts([address]);
        return result.get(address.toString())!;
    }

    /**
     * Parse an account from its raw data
     * @param account - The raw account data
     */
    protected abstract parseAccount(account: AccountInfo<Buffer>): T;
}