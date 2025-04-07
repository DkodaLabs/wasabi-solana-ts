import { Program, BN } from '@coral-xyz/anchor';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PDA } from '../utils';

type AddCollateralArgs = {
    downPayment: number;
    fee: number;
    expiration: number;
};

type AddCollateralAccounts = {
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
        const pool = (
            await config.program.provider.connection.getAccountInfo(config.accounts.position)
        ).owner;
        if (!pool) throw new Error('Failed to retrieve position');
        const poolState = await config.program.account.basePool.fetchNullable(pool);

        const collateralTokenProgram = (
            await config.program.provider.connection.getAccountInfo(poolState.collateral)
        ).owner;

        const ownerTargetCurrencyAccount = getAssociatedTokenAddressSync(
            poolState.collateral,
            config.accounts.owner,
            false,
            collateralTokenProgram
        );
        return {
            accounts: {
                owner: config.accounts.owner,
                ownerTargetCurrencyAccount,
                position: config.accounts.position,
                pool,
                collateralVault: poolState.collateralVault,
                collateral: poolState.collateral,
                feeWallet: config.accounts.feeWallet,
                globalSettings: PDA.getGlobalSettings(),
                collateralTokenProgram
            }
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
    accounts: AddCollateralAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: addCollateralConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
