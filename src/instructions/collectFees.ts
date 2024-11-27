import { Program } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey,
    SystemProgram
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from '../base';
import { PDA, getPermission, getTokenProgram } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type CollectFeesAccounts = {
    protocolWallet: PublicKey;
    asset: PublicKey;
}

type CollectFeesInstructionAccounts = {
    authority: PublicKey;
    permission: PublicKey;
    protocolWallet: PublicKey;
    asset: PublicKey;
}

type CollectFeesInstructionAccountsStrict = CollectFeesInstructionAccounts & {
    globalSettings: PublicKey;
    systemProgram: PublicKey;
}

export const closeWalletConfig: BaseMethodConfig<
    null,
    CollectFeesAccounts,
    CollectFeesInstructionAccounts | CollectFeesInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<null, CollectFeesAccounts>) => {
        const tokenProgram = await getTokenProgram(
            config.program.provider.connection,
            config.accounts.asset
        );

        const allAccounts = {
            authority: config.program.provider.publicKey,
            authorityAta: getAssociatedTokenAddressSync(
                config.accounts.asset,
                config.program.provider.publicKey,
                false,
                tokenProgram
            ),
            asset: config.accounts.asset,
            permission: await getPermission(config.program, config.program.provider.publicKey),
            protocolWallet: config.accounts.protocolWallet,
            protocolWalletAta: getAssociatedTokenAddressSync(
                config.accounts.asset,
                config.accounts.protocolWallet,
                true,
                tokenProgram
            ),
            globalSettings: PDA.getGlobalSettings(),
            systemProgram: SystemProgram.programId,
        };

        return {
            accounts: config.strict ? allAccounts
                : {
                    authority: allAccounts.authority,
                    asset: allAccounts.asset,
                    permission: allAccounts.permission,
                    protocolWallet: allAccounts.protocolWallet,
                },
        };
    },
    getMethod: (program) => () => program.methods.collectFees()
}

export async function createCollectFeesInstruction(
    program: Program<WasabiSolana>,
    accounts: CollectFeesAccounts,
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

export async function collectFees(
    program: Program<WasabiSolana>,
    accounts: CollectFeesAccounts,
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

