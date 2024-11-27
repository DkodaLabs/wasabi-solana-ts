import { Program } from '@coral-xyz/anchor';
import {
    TransactionSignature,
    TransactionInstruction,
    PublicKey,
    SystemProgram
} from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type InitOrUpdatePermissionArgs = {
    status: AuthorityStatus;
    canInitVaults: boolean;
    canLiquidate: boolean;
    canCosignSwaps: boolean;
    canBorrowFromVaults: boolean;
    canInitPools: boolean;
    canManageWallets: boolean;
};

export type InitOrUpdatePermissionAccounts = {
    payer: PublicKey;
    newAuthority: PublicKey;
};

export enum AuthorityStatus {
    Inactive = 0,
    Active = 1
}

type InitOrUpdatePermissionInstructionAccounts = {
    payer: PublicKey;
    newAuthority: PublicKey;
};

type initOrUpdatePermissionInstructionAccountsStrict = {
    authority: PublicKey;
    superAdminPermission: PublicKey;
    permission: PublicKey;
    systemProgram: PublicKey;
} & InitOrUpdatePermissionInstructionAccounts;

const initOrUpdatePermissionConfig: BaseMethodConfig<
    InitOrUpdatePermissionArgs,
    InitOrUpdatePermissionAccounts,
    InitOrUpdatePermissionInstructionAccounts | initOrUpdatePermissionInstructionAccountsStrict
> = {
    process: async (
        config: ConfigArgs<InitOrUpdatePermissionArgs, InitOrUpdatePermissionAccounts>
    ) => {
        const allAccounts = {
            payer: config.accounts.payer,
            authority: config.program.provider.publicKey,
            superAdminPermission: PDA.getSuperAdmin(),
            newAuthority: config.accounts.newAuthority,
            permission: PDA.getAdmin(config.accounts.newAuthority),
            systemProgram: SystemProgram.programId
        };

        return {
            accounts: config.strict
                ? allAccounts
                : {
                      payer: allAccounts.payer,
                      newAuthority: allAccounts.newAuthority
                  },
            args: {
                canCosignSwaps: config.args.canCosignSwaps,
                canInitVaults: config.args.canInitVaults,
                canLiquidate: config.args.canLiquidate,
                canBorrowFromVaults: config.args.canBorrowFromVaults,
                canInitPools: config.args.canInitPools,
                status: { active: {} }
            }
        };
    },
    getMethod: (program) => (args) => program.methods.initOrUpdatePermission(args)
};

export async function createInitOrUpdatePermissionInstruction(
    program: Program<WasabiSolana>,
    args: InitOrUpdatePermissionArgs,
    accounts: InitOrUpdatePermissionAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initOrUpdatePermissionConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function initOrUpdatePermission(
    program: Program<WasabiSolana>,
    args: InitOrUpdatePermissionArgs,
    accounts: InitOrUpdatePermissionAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initOrUpdatePermissionConfig,
            'TRANSACTION',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionSignature>;
}
