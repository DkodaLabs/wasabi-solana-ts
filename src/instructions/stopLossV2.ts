import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    ClosePositionAccounts,
    ClosePositionArgs,
    ClosePositionInternalInstructionAccounts
} from './closePositionV2';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { WasabiSolana } from '../idl';
import { BN, Program } from '@coral-xyz/anchor';
import { extractInstructionData } from './shared';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PDA } from '../utils';
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';

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

        const [currencyAccount, collateralAccount] =
            await config.program.provider.connection.getMultipleAccountsInfo([
                poolAccount.currency,
                poolAccount.collateral
            ]);

        const lpVault = PDA.getLpVault(poolAccount.currency);
        const currencyTokenProgram = currencyAccount.owner;
        const collateralTokenProgram = collateralAccount.owner;

        return {
            accounts: {
                stopLossOrder: PDA.getStopLossOrder(config.accounts.position),
                closePosition: {
                    owner: config.accounts.owner,
                    ownerPayoutAccount: poolAccount.isLongPool
                        ? getAssociatedTokenAddressSync(
                              poolAccount.currency,
                              config.accounts.owner,
                              false,
                              currencyTokenProgram
                          )
                        : getAssociatedTokenAddressSync(
                              poolAccount.collateral,
                              config.accounts.owner,
                              false,
                              collateralTokenProgram
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
                    systemProgram: SYSTEM_PROGRAM_ID
                }
            },
            args: {
                ...config.args,
                hops,
                data
            },
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.stopLoss(
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
    accounts: ClosePositionAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: stopLossConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
