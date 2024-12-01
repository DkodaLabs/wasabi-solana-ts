import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionSignature,
    TransactionInstruction
} from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import {
    WithdrawArgs,
    WithdrawAccounts,
    TokenInstructionAccounts,
    getTokenInstructionAccounts,
} from './tokenAccounts';
import { handleMint } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export const withdrawConfig: BaseMethodConfig<
    WithdrawArgs,
    WithdrawAccounts,
    TokenInstructionAccounts
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

        return {
            accounts: await getTokenInstructionAccounts(
                config.program,
                mint,
                tokenProgram
            ),
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
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            withdrawConfig,
            'INSTRUCTION',
            {
                level: feeLevel,
                ixType: 'VAULT',
            },
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function withdraw(
    program: Program<WasabiSolana>,
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            withdrawConfig,
            'TRANSACTION',
            {
                level: feeLevel,
                ixType: 'VAULT',
            },
            args
        )
    ) as Promise<TransactionSignature>;
}
