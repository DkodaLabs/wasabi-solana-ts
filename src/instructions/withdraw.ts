import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
} from '../base';
import {
    WithdrawArgs,
    WithdrawAccounts,
    TokenInstructionAccounts,
    getTokenInstructionAccounts
} from './tokenAccounts';
import { handleMint } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export const withdrawConfig: BaseMethodConfig<
    WithdrawArgs,
    WithdrawAccounts,
    TokenInstructionAccounts
> = {
    process: async (config: ConfigArgs<WithdrawArgs, WithdrawAccounts>) => {
        const { mint, tokenProgram, setupIx, cleanupIx } = await handleMint(
            config.program.provider.connection,
            config.accounts.assetMint,
            {
                owner: config.program.provider.publicKey,
                wrapMode: 'unwrap',
                mintCache: config.mintCache
            }
        );

        return {
            accounts: await getTokenInstructionAccounts(config.program, mint, tokenProgram),
            args: config.args ? new BN(config.args.amount.toString()) : undefined,
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) => program.methods.withdraw(args)
};

export async function createWithdrawInstruction(
    program: Program<WasabiSolana>,
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: withdrawConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
