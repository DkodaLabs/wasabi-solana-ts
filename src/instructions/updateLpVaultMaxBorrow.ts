import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction, TransactionSignature, PublicKey } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import { PDA, getPermission } from '../utils';

export type UpdateVaultMaxBorrowArgs = {
    maxBorrow: number; // u64
};

export type UpdateVaultMaxBorrowAccounts = {
    authority: PublicKey;
    assetMint: PublicKey;
};

type UpdateVaultMaxBorrowInstructionAccounts = {
    payer: PublicKey;
    permission: PublicKey;
    lpVault: PublicKey;
};

type UpdateVaultMaxBorrowInstructionAccountsStrict = {
    authority: PublicKey;
} & UpdateVaultMaxBorrowInstructionAccounts;

const updateVaultMaxBorrowConfig: BaseMethodConfig<
    UpdateVaultMaxBorrowArgs,
    UpdateVaultMaxBorrowAccounts,
    UpdateVaultMaxBorrowInstructionAccounts | UpdateVaultMaxBorrowInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<UpdateVaultMaxBorrowArgs, UpdateVaultMaxBorrowAccounts>) => {
        const admin = PDA.getAdmin(config.accounts.authority);
        const allAccounts = {
            payer: config.program.provider.publicKey,
            authority: config.accounts.authority,
            permission: await getPermission(config.program, admin),
            lpVault: PDA.getLpVault(config.accounts.assetMint)
        };

        return {
            accounts: config.strict
                ? allAccounts
                : {
                      payer: allAccounts.payer,
                      permission: allAccounts.permission,
                      lpVault: allAccounts.lpVault
                  },
            args: config.args ? new BN(config.args.maxBorrow) : undefined
        };
    },
    getMethod: (program) => (args) => program.methods.updateLpVaultMaxBorrow(args)
};

export async function createUpdateVaultMaxBorrowInstruction(
    program: Program<WasabiSolana>,
    args: UpdateVaultMaxBorrowArgs,
    accounts: UpdateVaultMaxBorrowAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            updateVaultMaxBorrowConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function updateVaultMaxBorrow(
    program: Program<WasabiSolana>,
    args: UpdateVaultMaxBorrowArgs,
    accounts: UpdateVaultMaxBorrowAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            updateVaultMaxBorrowConfig,
            'TRANSACTION',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionSignature>;
}
