import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
} from '../base';
import { PDA, handleMint, getPermission, validateArgs, validateProviderPubkey } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';
import {TokenMintCache} from "../cache/TokenMintCache";

export type DonateArgs = {
    amount: bigint; // u64
};

export type DonateAccounts = {
    currency: PublicKey;
};

type DonateInstructionAccounts = {
    owner: PublicKey;
    lpVault: PublicKey;
    currency: PublicKey;
    tokenProgram: PublicKey;
};

type DonateIntructionAccountsStrict = {
    ownerAssetAccount: PublicKey;
    vault: PublicKey;
} & DonateInstructionAccounts;

const donateConfig: BaseMethodConfig<
    DonateArgs,
    DonateAccounts,
    DonateInstructionAccounts | DonateIntructionAccountsStrict
> = {
    process: async (config: ConfigArgs<DonateArgs, DonateAccounts>) => {
        const args = validateArgs(config.args);
        const payer = validateProviderPubkey(config.program.provider.publicKey);
        const [{ mint, tokenProgram, setupIx, cleanupIx }, permission] = await Promise.all([
            handleMint(
                config.program.provider.connection,
                config.accounts.currency,
                {
                    owner: config.program.provider.publicKey,
                    wrapMode: 'wrap',
                    amount: args.amount,
                    mintCache: config.mintCache
                }
            ),
            getPermission(config.program, payer),
        ]);

        const lpVault = PDA.getLpVault(mint);

        return {
            accounts: {
                owner: payer,
                ownerAssetAccount: getAssociatedTokenAddressSync(
                    mint,
                    payer,
                    false,
                    tokenProgram
                ),
                lpVault,
                vault: getAssociatedTokenAddressSync(mint, lpVault, true, tokenProgram),
                currency: config.accounts.currency,
                permission,
                globalSettings: PDA.getGlobalSettings(),
                tokenProgram
            },
            args: new BN(args.amount.toString()),
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) => program.methods.donate(args)
};

export async function createDonateInstruction(
    program: Program<WasabiSolana>,
    args: DonateArgs,
    accounts: DonateAccounts,
    mintCache?: TokenMintCache,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: donateConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
