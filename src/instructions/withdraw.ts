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
    handleWithdrawRedeemUnwrapSol,
} from './tokenAccounts';
import { WasabiSolana } from '../idl/wasabi_solana';

export const withdrawConfig: BaseMethodConfig<
    WithdrawArgs,
    WithdrawAccounts,
    TokenInstructionAccounts | TokenInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<WithdrawArgs, WithdrawAccounts>) => {
        const {
            assetMint,
            assetTokenProgram,
            setupIx,
            cleanupIx,
        } = await handleWithdrawRedeemUnwrapSol(
            config.program.provider.connection,
            config.program.provider.publicKey,
            config.accounts.assetMint,
            config.args.amount,
        );

        const allAccounts = await getTokenInstructionAccounts(
            config.program,
            assetMint,
            assetTokenProgram
        );

        return {
            accounts: config.strict
                ? allAccounts
                : {
                    owner: config.program.provider.publicKey,
                    lpVault: allAccounts.lpVault,
                    assetMint: config.accounts.assetMint,
                    assetTokenProgram
                },
            args: config.args ? new BN(config.args.amount) : undefined,
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
