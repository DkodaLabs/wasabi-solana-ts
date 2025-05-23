import { PublicKey, AccountInfo, Connection } from "@solana/web3.js";

/**
 * A class that caches mint account data
 */
export class MintCache {
    private cache: Map<string, AccountInfo<Buffer>> = new Map();
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    async getMintInfos(mints: PublicKey[]): Promise<Map<PublicKey, AccountInfo<Buffer>>> {
        const missingMints: PublicKey[] = [];
        const results = new Map<PublicKey, AccountInfo<Buffer>>();

        mints.forEach((mint) => {
            const key = mint.toBase58();
            if (this.cache.has(key)) {
                results.set(mint, this.cache.get(key)!);
            } else {
                missingMints.push(mint);
            }
        });

        if (missingMints.length > 0) {
            const fetchedInfos = await this.connection.getMultipleAccountsInfo(missingMints);
            missingMints.forEach((mint, idx) => {
                const info = fetchedInfos[idx] || null;
                if (info) {
                    const key = mint.toBase58();
                    this.cache.set(key, info);
                    results.set(mint, info);
                }
            });
        }

        return results;
    }
}