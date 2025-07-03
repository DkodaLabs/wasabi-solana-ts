import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { createPositionMethodBuilder, processPositionInstruction } from './shared';
import { MintCache } from '../utils';
import { Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';

export type OpenLongPositionInstructionAccounts = {
    owner: PublicKey;
    ownerCurrencyAccount: PublicKey;
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
    debtController: PublicKey;
    globalSettings: PublicKey;
    tokenProgram: PublicKey;
    systemProgram: PublicKey;
};

const openLongPositionConfig: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    OpenLongPositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        return processPositionInstruction<OpenLongPositionInstructionAccounts>(config, {
            useShares: false,
            isUpdate: false,
            methodName: 'OpenLongPosition'
        });
    },
    getMethod: createPositionMethodBuilder('openLongPosition', false)
};

export async function createOpenLongPositionInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openLongPositionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
