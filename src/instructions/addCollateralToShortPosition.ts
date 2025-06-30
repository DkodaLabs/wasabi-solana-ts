import { Program, BN } from '@coral-xyz/anchor';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { handleOpenTokenAccounts, MintCache, PDA } from '../utils';

export type AddCollateralArgs = {
    downPayment: number;
    fee: number;
    expiration: number;
};

export type AddCollateralAccounts = {
    owner: PublicKey;
    position: PublicKey;
    feeWallet: PublicKey;
};

type AddCollateralInstructionAccounts = {
    owner: PublicKey;
    ownerTargetCurrencyAccount: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    collateral: PublicKey;
    feeWallet: PublicKey;
    globalSettings: PublicKey;
    collateralTokenProgram: PublicKey;
};

const addCollateralConfig: BaseMethodConfig<
    AddCollateralArgs,
    AddCollateralAccounts,
    AddCollateralInstructionAccounts
> = {
    process: async (config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>) => {
        const position = await config.program.account.position.fetchNullable(
            config.accounts.position
        );
        if (!position) throw new Error('Position not found');

        const pool = PDA.getShortPool(position.collateral, position.currency);

        const { ownerPaymentAta, setupIx, cleanupIx, collateralTokenProgram } =
            await handleOpenTokenAccounts({
                program: config.program,
                owner: config.accounts.owner,
                mintCache: config.mintCache,
                downPayment: config.args.downPayment,
                fee: config.args.fee,
                currency: position.currency,
                collateral: position.collateral,
                isLongPool: false
            });

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerTargetCurrencyAccount: ownerPaymentAta,
                position: config.accounts.position,
                pool,
                collateralVault: position.collateralVault,
                collateral: position.collateral,
                feeWallet: config.accounts.feeWallet,
                globalSettings: PDA.getGlobalSettings(),
                collateralTokenProgram
            },
            args: {
                downPayment: config.args.downPayment,
                feesToPaid: config.args.fee,
                expiration: config.args.expiration
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.addCollateralToShortPosition(
            new BN(args.downPayment),
            new BN(args.feesToPaid),
            new BN(args.expiration)
        )
};

export async function createAddCollateralToShortPositionInstruction(
    program: Program<WasabiSolana>,
    args: AddCollateralArgs,
    accounts: AddCollateralAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: addCollateralConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
