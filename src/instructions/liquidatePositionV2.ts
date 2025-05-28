import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    ClosePositionAccounts,
    ClosePositionArgs,
    ClosePositionInstructionAccounts,
    ClosePositionInternalInstructionAccounts
} from './closePositionV2';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { extractInstructionData } from './shared';
import { MintCache, PDA, handleCloseTokenAccounts } from '../utils';
import { getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';

type LiquidateInstructionAccounts = {
    closePosition: ClosePositionInternalInstructionAccounts;
};

const liquidatePositionConfig: BaseMethodConfig<
    ClosePositionArgs,
    ClosePositionAccounts,
    LiquidateInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionArgs, ClosePositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);
        const poolAccount = await config.program.account.basePool.fetchNullable(
            config.accounts.pool
        );

        if (!poolAccount) {
            throw new Error('Pool does not exist');
        }

        const { ownerPayoutAta, setupIx, cleanupIx, currencyTokenProgram, collateralTokenProgram } =
            await handleCloseTokenAccounts(
                {
                    program: config.program,
                    accounts: { owner: config.accounts.owner },
                    mintCache: config.mintCache
                },
                poolAccount
            );

        const lpVault = PDA.getLpVault(poolAccount.currency);

        return {
            accounts: {
                closePosition: {
                    owner: config.accounts.owner,
                    ownerPayoutAccount: ownerPayoutAta ?? getAssociatedTokenAddressSync(
                        poolAccount.isLongPool ? poolAccount.currency : poolAccount.collateral,
                        config.accounts.owner,
                        false,
                        poolAccount.isLongPool ? currencyTokenProgram : collateralTokenProgram
                    ),
                    lpVault,
                    vault: getAssociatedTokenAddressSync(
                        poolAccount.currency,
                        lpVault,
                        true,
                        currencyTokenProgram
                    ),
                    pool: config.accounts.pool,
                    currencyVault: poolAccount.currencyVault,
                    collateralVault: poolAccount.collateralVault,
                    currency: poolAccount.currency,
                    collateral: poolAccount.collateral,
                    position: config.accounts.position,
                    authority: config.accounts.authority,
                    permission: PDA.getAdmin(config.accounts.authority),
                    feeWallet: config.accounts.feeWallet,
                    liquidationWallet: config.accounts.liquidationWallet,
                    debtController: PDA.getDebtController(),
                    globalSettings: PDA.getGlobalSettings(),
                    currencyTokenProgram,
                    collateralTokenProgram,
                    systemProgram: SYSTEM_PROGRAM_ID
                }
            },
            args: {
                ...config.args,
                hops,
                data
            },
            setup: setupIx,
            cleanup: cleanupIx,
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.liquidatePosition(
            new BN(args.minTargetAmount),
            new BN(args.interest),
            new BN(args.executionFee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createLiquidatePositionInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionArgs,
    accounts: ClosePositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: liquidatePositionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
