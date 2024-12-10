import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
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
            config.program.provider.publicKey,
            'unwrap'
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
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: redeemConfig,
        feeLevel: {
            level: feeLevel,
            ixType: 'VAULT'
        },
        args
    }) as Promise<TransactionInstruction[]>;
}
