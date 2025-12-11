import { AccountInfo, PublicKey } from '@solana/web3.js';
import { BaseAccountCache } from './BaseAccountCache';
import { MintLayout, RawMint } from '@solana/spl-token';

export type TokenMintData = {
    program: PublicKey;
    mintData: RawMint;
}

/**
 * A class that caches token mint account data
 */
export class TokenMintCache extends BaseAccountCache<TokenMintData> {
    protected parseAccount(account: AccountInfo<Buffer>): TokenMintData {
        return {
            program: account.owner,
            mintData: MintLayout.decode(account.data),
        };
    }

    public async getMintToDecimals(mints: PublicKey[]): Promise<Map<string, number>> {
        const m = await this.getAccounts(mints);
        const mintMap = new Map<string, number>();
        m.forEach((value, key) => {
            mintMap.set(key, value.mintData.decimals);
        });
        return mintMap;
    }
}