import { Program, BN } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
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
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            redeemConfig,
            'INSTRUCTION',
            {
                level: feeLevel,
                ixType: 'VAULT'
            },
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function redeem(
    program: Program<WasabiSolana>,
    args: RedeemArgs,
    accounts: RedeemAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            redeemConfig,
            'TRANSACTION',
            {
                level: feeLevel,
                ixType: 'VAULT'
            },
            args
        )
    ) as Promise<TransactionSignature>;
}
