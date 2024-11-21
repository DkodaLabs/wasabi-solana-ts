import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionSignature,
    TransactionInstruction
} from '@solana/web3.js';
import {
    BaseMethodConfig,
    handleMethodCall,
    ConfigArgs,
    constructMethodCallArgs
} from '../base';
import {
    WithdrawArgs,
    WithdrawAccounts,
    TokenInstructionAccounts,
    TokenInstructionAccountsStrict,
    getTokenInstructionAccounts,
} from './tokenAccounts';
import { handleMint } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export const withdrawConfig: BaseMethodConfig<
    WithdrawArgs,
    WithdrawAccounts,
    TokenInstructionAccounts | TokenInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<WithdrawArgs, WithdrawAccounts>) => {
        const {
            mint,
            tokenProgram,
            setupIx,
            cleanupIx,
        } = await handleMint(
            config.program.provider.connection,
            config.accounts.assetMint,
            config.program.provider.publicKey,
            'unwrap',
        );

        const allAccounts = await getTokenInstructionAccounts(
            config.program,
            mint,
            tokenProgram
        );

        return {
            accounts: config.strict
                ? allAccounts
                : {
                    owner: config.program.provider.publicKey,
                    lpVault: allAccounts.lpVault,
                    assetMint: mint,
                    assetTokenProgram: tokenProgram
                },
            args: config.args ? new BN(config.args.amount.toString()) : undefined,
            setup: setupIx,
            cleanup: cleanupIx,
        };
    },
    getMethod: (program) => (args) => program.methods.withdraw(args)
};

export async function createWithdrawInstruction(
    program: Program<WasabiSolana>,
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            withdrawConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function withdraw(
    program: Program<WasabiSolana>,
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            withdrawConfig,
            'transaction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionSignature>;
}
