import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    ClosePositionAccounts,
    ClosePositionArgs,
    ClosePositionInternalInstructionAccounts
} from './closePositionV2';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { extractInstructionData } from './shared';
import { PDA } from '../utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';

type TakeProfitInstructionAccounts = {
    takeProfitOrder: PublicKey;
    closePosition: ClosePositionInternalInstructionAccounts;
};

const takeProfitConfig: BaseMethodConfig<
    ClosePositionArgs,
    ClosePositionAccounts,
    TakeProfitInstructionAccounts
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

        const currencyTokenProgram = currencyAccount.owner;
        const collateralTokenProgram = collateralAccount.owner;

        return {
            accounts: {
                takeProfitOrder: PDA.getTakeProfitOrder(config.accounts.position),
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
                        config.accounts.pool,
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
    getMethod: (program) => (args) => program.methods.takeProfit(
        new BN(args.minTargetAmount),
        new BN(args.interest),
        new BN(args.executionFee),
        new BN(args.expiration),
        { hops: args.hops },
        args.data
    )
};

export async function createTakeProfitInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionArgs,
    accounts: ClosePositionAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: takeProfitConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
