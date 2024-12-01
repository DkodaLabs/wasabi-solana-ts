import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey, TransactionSignature } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import { PDA, handleMint } from '../utils';
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
        const { mint, tokenProgram, setupIx, cleanupIx } = await handleMint(
            config.program.provider.connection,
            config.accounts.currency,
            config.program.provider.publicKey,
            'wrap',
            config.args.amount
        );

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
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            donateConfig,
            'INSTRUCTION',
            {
                level: feeLevel,
                ixType: 'VAULT'
            },
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function donate(
    program: Program<WasabiSolana>,
    args: DonateArgs,
    accounts: DonateAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            donateConfig,
            'TRANSACTION',
            {
                level: feeLevel,
                ixType: 'VAULT'
            },
            args
        )
    ) as Promise<TransactionSignature>;
}
