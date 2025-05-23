import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
} from '../base';
import { PDA, handleMint, getPermission } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

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
        const [{ mint, tokenProgram, setupIx, cleanupIx }, permission] = await Promise.all([
            handleMint(
                config.program.provider.connection,
                config.accounts.currency,
                {
                    owner: config.program.provider.publicKey,
                    wrapMode: 'wrap',
                    amount: config.args.amount,
                    mintCache: config.mintCache
                }
            ),
            getPermission(config.program, config.program.provider.publicKey),
        ]);

        const lpVault = PDA.getLpVault(mint);

        return {
            accounts: {
                owner: config.program.provider.publicKey,
                ownerAssetAccount: getAssociatedTokenAddressSync(
                    mint,
                    config.program.provider.publicKey,
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
            args: config.args ? new BN(config.args.amount.toString()) : undefined,
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
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: donateConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
