import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    ClosePositionAccounts,
    ClosePositionArgs,
    ClosePositionInternalInstructionAccounts
} from './closePositionV2';
import {PublicKey, SystemProgram, TransactionInstruction} from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { extractInstructionData } from './shared';
import { MintCache, PDA } from '../utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

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

        const lpVault = PDA.getLpVault(poolAccount.currency);
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
                    systemProgram: SystemProgram.programId
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
        program.methods.takeProfit(
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
    accounts: ClosePositionAccounts,
    mintCache?: MintCache,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: takeProfitConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
