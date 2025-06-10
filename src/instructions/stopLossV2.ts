import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    ClosePositionAccounts,
    ClosePositionArgs,
    ClosePositionInternalInstructionAccounts
} from './closePositionV2';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { WasabiSolana } from '../idl';
import { BN, Program } from '@coral-xyz/anchor';
import { extractInstructionData } from './shared';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { handleCloseTokenAccounts, MintCache, PDA } from '../utils';
import { handleOrdersCheck } from './closePosition';

type StopLossInstructionAccounts = {
    closePosition: ClosePositionInternalInstructionAccounts;
    stopLossOrder: PublicKey;
};

const stopLossConfig: BaseMethodConfig<
    ClosePositionArgs,
    ClosePositionAccounts,
    StopLossInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionArgs, ClosePositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        const poolAccount = await config.program.account.basePool.fetchNullable(
            config.accounts.pool
        );

        if (!poolAccount) {
            throw new Error('Position does not exist');
        }

        const [{ ownerPayoutAta, setupIx, cleanupIx, currencyTokenProgram, collateralTokenProgram }, orderIxes] =
            await Promise.all([
                handleCloseTokenAccounts(
                    {
                        program: config.program,
                        accounts: { owner: config.accounts.owner },
                        mintCache: config.mintCache
                    },
                    poolAccount
                ),
                handleOrdersCheck(config.program, config.accounts.position, 'STOP_LOSS')
            ]);

        const lpVault = PDA.getLpVault(poolAccount.currency);

        return {
            accounts: {
                stopLossOrder: PDA.getStopLossOrder(config.accounts.position),
                closePosition: {
                    owner: config.accounts.owner,
                    ownerPayoutAccount: ownerPayoutAta ?? getAssociatedTokenAddressSync(
                        poolAccount.isLongPool ? poolAccount.currency : poolAccount.collateral,
                        config.accounts.owner,
                        false,
                        poolAccount.isLongPool ? currencyTokenProgram : collateralTokenProgram
                    ),
                    lpVault: PDA.getLpVault(poolAccount.currency),
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
                    systemProgram: SystemProgram.programId
                }
            },
            args: {
                ...config.args,
                hops,
                data
            },
            setup: [...orderIxes, ...setupIx],
            cleanup: cleanupIx,
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.stopLoss(
            new BN(args.amount),
            new BN(args.minTargetAmount),
            new BN(args.interest),
            new BN(args.executionFee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createStopLossInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionArgs,
    accounts: ClosePositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: stopLossConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
