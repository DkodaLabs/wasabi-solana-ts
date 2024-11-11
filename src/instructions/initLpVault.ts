import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey, SystemProgram } from '@solana/web3.js';
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync
} from '@solana/spl-token';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import { PDA, getPermission, getTokenProgram } from '../utils';

export type InitLpVaultArgs = {
    name: string;
    symbol: string;
    uri: string;
};

export type InitLpVaultAccounts = {
    admin: PublicKey;
    assetMint: PublicKey;
};

type InitLpVaultInstructionAccounts = {
    payer: PublicKey;
    permission: PublicKey;
    assetMint: PublicKey;
    assetTokenProgram: PublicKey;
};

type InitLpVaultInstructionAccountsStrict = {
    authority: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    sharesMint: PublicKey;
    sharesTokenProgram: PublicKey;
    associatedTokenProgram: PublicKey;
    systemProgram: PublicKey;
} & InitLpVaultInstructionAccounts;

export const initLpVaultConfig: BaseMethodConfig<
    InitLpVaultArgs,
    InitLpVaultAccounts,
    InitLpVaultInstructionAccounts | InitLpVaultInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<InitLpVaultArgs, InitLpVaultAccounts>) => {
        const lpVault = PDA.getLpVault(config.accounts.assetMint);
        const assetTokenProgram = await getTokenProgram(
            config.program.provider.connection,
            config.accounts.assetMint
        );
        const allAccounts = {
            payer: config.program.provider.publicKey,
            authority: config.program.provider.publicKey,
            permission: await getPermission(config.program, config.accounts.admin),
            lpVault,
            assetMint: config.accounts.assetMint,
            vault: getAssociatedTokenAddressSync(
                config.accounts.assetMint,
                lpVault,
                true,
                assetTokenProgram
            ),
            sharesMint: PDA.getSharesMint(lpVault, config.accounts.assetMint),
            assetTokenProgram,
            sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
        };

        return {
            accounts: config.strict
                ? allAccounts
                : {
                      payer: allAccounts.payer,
                      permission: allAccounts.permission,
                      assetMint: allAccounts.assetMint,
                      assetTokenProgram
                  },
            args: config.args
        };
    },
    getMethod: (program) => (args) => program.methods.initLpVault(args)
};

export async function createInitLpVaultInstruction(
    program: Program<WasabiSolana>,
    args: InitLpVaultArgs,
    accounts: InitLpVaultAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initLpVaultConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function initLpVault(
    program: Program<WasabiSolana>,
    args: InitLpVaultArgs,
    accounts: InitLpVaultAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initLpVaultConfig,
            'transaction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}
