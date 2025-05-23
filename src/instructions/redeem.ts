import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
} from '../base';
import {
    RedeemArgs,
    RedeemAccounts,
    TokenInstructionAccounts,
    getTokenInstructionAccounts
} from './tokenAccounts';
import { handleMint } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export const redeemConfig: BaseMethodConfig<RedeemArgs, RedeemAccounts, TokenInstructionAccounts> =
{
    process: async (config: ConfigArgs<RedeemArgs, RedeemAccounts>) => {
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
    getMethod: (program) => (args) => program.methods.redeem(args)
};

export async function createRedeemInstruction(
    program: Program<WasabiSolana>,
    args: RedeemArgs,
    accounts: RedeemAccounts,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: redeemConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
