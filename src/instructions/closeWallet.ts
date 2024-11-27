import { Program } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey,
    SystemProgram
} from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from '../base';
import { PDA, getPermission } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type CloseWalletAccounts = {
    protocolWallet: PublicKey;
}

type CloseWalletInstructionAccounts = {
    authority: PublicKey;
    permission: PublicKey;
    protocolWallet: PublicKey;
}

type CloseWalletInstructionAccountsStrict = CloseWalletInstructionAccounts & {
    globalSettings: PublicKey;
    systemProgram: PublicKey;
}

export const closeWalletConfig: BaseMethodConfig<
    null,
    CloseWalletAccounts,
    CloseWalletInstructionAccounts | CloseWalletInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<null, CloseWalletAccounts>) => {
        const allAccounts = {
            authority: config.program.provider.publicKey,
            permission: await getPermission(config.program, config.program.provider.publicKey),
            protocolWallet: config.accounts.protocolWallet,
            globalSettings: PDA.getGlobalSettings(),
            systemProgram: SystemProgram.programId,
        };

        return {
            accounts: config.strict ? allAccounts
                : {
                    authority: allAccounts.authority,
                    permission: allAccounts.permission,
                    protocolWallet: allAccounts.protocolWallet,
                },
        };
    },
    getMethod: (program) => () => program.methods.closeWallet()
}

export async function createCloseWalletInstruction(
    program: Program<WasabiSolana>,
    accounts: CloseWalletAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeWalletConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function closeWallet(
    program: Program<WasabiSolana>,
    accounts: CloseWalletAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeWalletConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
        )
    ) as Promise<TransactionSignature>;
}
