import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    ClosePositionAccounts,
    ClosePositionArgs,
    ClosePositionInternalInstructionAccounts
} from './closePositionV2';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { extractInstructionData } from './shared';
import { handleCloseTokenAccounts, MintCache, PDA, validateArgs, validateMintCache } from '../utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { handleOrdersCheck } from './closePosition';

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
        const args = validateArgs(config.args);
        const mintCache = validateMintCache(config.mintCache);
        const { hops, data, remainingAccounts } = extractInstructionData(args.instructions);

        const poolAccount = await config.program.account.basePool.fetchNullable(
            config.accounts.pool
        );

        if (!poolAccount) {
            throw new Error('Pool does not exist');
        }

        const [
            { ownerPayoutAta, setupIx, cleanupIx, currencyTokenProgram, collateralTokenProgram },
            orderIxes
        ] = await Promise.all([
            handleCloseTokenAccounts(
                {
                    program: config.program,
                    owner: config.accounts.owner,
                    authority: config.program.provider.publicKey,
                    mintCache,
                },
                poolAccount
            ),
            handleOrdersCheck(config.program, config.accounts.position, 'TAKE_PROFIT')
        ]);

        const lpVault = PDA.getLpVault(poolAccount.currency);

        return {
            accounts: {
                takeProfitOrder: PDA.getTakeProfitOrder(config.accounts.position),
                closePosition: {
                    owner: config.accounts.owner,
                    ownerPayoutAccount: ownerPayoutAta,
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
            setup: [...orderIxes, ...setupIx],
            cleanup: cleanupIx,
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.takeProfit(
            new BN(args.amount),
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
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: takeProfitConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
