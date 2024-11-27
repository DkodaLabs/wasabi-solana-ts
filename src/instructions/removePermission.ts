import { Program } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey,
} from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from '../base';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type RemovePermissionAccounts = {
    permission: PublicKey;
}

type RemovePermissionInstructionAccounts = {
    authority: PublicKey;
    superAdminPermission: PublicKey,
    permission: PublicKey;
}

export const removePermissionConfig: BaseMethodConfig<
    null,
    RemovePermissionAccounts,
    RemovePermissionInstructionAccounts | null
> = {
    process: async (config: ConfigArgs<null, RemovePermissionAccounts>) => {
        return {
            accounts: {
                authority: config.program.provider.publicKey,
                superAdminPermission: PDA.getSuperAdmin(),
                permission: config.accounts.permission,
            },
        };
    },
    getMethod: (program) => () => program.methods.removePermission()
}

export async function createRemovePermissionInstruction(
    program: Program<WasabiSolana>,
    accounts: RemovePermissionAccounts,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            removePermissionConfig,
            'INSTRUCTION',
            null,
            increaseCompute,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function removePermission(
    program: Program<WasabiSolana>,
    accounts: RemovePermissionAccounts,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            removePermissionConfig,
            'INSTRUCTION',
            null,
            increaseCompute,
        )
    ) as Promise<TransactionSignature>;
}

