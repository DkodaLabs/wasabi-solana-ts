import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { WasabiSolana } from '../idl';
import { BN, Program } from '@coral-xyz/anchor';
import { MintCache, PDA } from '../utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { extractInstructionData } from './shared';
import { handleOrdersCheck } from './closePosition';

export type ClosePositionArgs = {
    amount: number | bigint;
    minTargetAmount: number | bigint;
    interest: number | bigint;
    executionFee: number | bigint;
    expiration: number | bigint;
    instructions: TransactionInstruction[];
};

export type ClosePositionAccounts = {
    owner: PublicKey;
    authority: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    feeWallet: PublicKey;
    liquidationWallet: PublicKey;
};

export type ClosePositionInstructionAccounts = {
    owner: PublicKey;
    closePosition: ClosePositionInternalInstructionAccounts;
};

export type ClosePositionInternalInstructionAccounts = {
    owner: PublicKey;
    ownerPayoutAccount: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    pool: PublicKey;
    currencyVault: PublicKey;
    collateralVault: PublicKey;
    currency: PublicKey;
    collateral: PublicKey;
    position: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    feeWallet: PublicKey;
    liquidationWallet: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
    systemProgram: PublicKey;
};

const closePostionConfig: BaseMethodConfig<
    ClosePositionArgs,
    ClosePositionAccounts,
    ClosePositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionArgs, ClosePositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);
        const poolAccount = await config.program.account.basePool.fetchNullable(
            config.accounts.pool
        );

        if (!poolAccount) {
            throw new Error('Position does not exist');
        }

        const [[currencyAccount, collateralAccount], orderIxes] =
            await Promise.all([
                config.program.provider.connection.getMultipleAccountsInfo([
                    poolAccount.currency,
                    poolAccount.collateral
                ]),
                handleOrdersCheck(config.program, config.accounts.position, 'MARKET')
            ]);

        const lpVault = PDA.getLpVault(poolAccount.currency);
        const currencyTokenProgram = currencyAccount.owner;
        const collateralTokenProgram = collateralAccount.owner;

        return {
            accounts: {
                owner: config.accounts.owner,
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
            setup: orderIxes,
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.closePosition(
            new BN(args.minTargetAmount),
            new BN(args.interest),
            new BN(args.executionFee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createClosePositionInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionArgs,
    accounts: ClosePositionAccounts,
    mintCache?: MintCache,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closePostionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
