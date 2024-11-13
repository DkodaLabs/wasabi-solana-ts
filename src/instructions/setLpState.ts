import { Program } from '@coral-xyz/anchor';
import { 
    PublicKey, 
    TransactionSignature, 
    TransactionInstruction 
} from '@solana/web3.js';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from '../base';
import { PDA } from '../utils';

export type LpStateArgs = {
    allow_trading: boolean;
};

export type LpStateAccounts = {
    authority: PublicKey;
}

type LpStateInstructionAccounts = LpStateAccounts;

type LpStateInstructionAccountsStrict = {
    authority: PublicKey,
    globalSettings: PublicKey,
    superAdmin: PublicKey,
};


const tradeStateConfig: BaseMethodConfig<
    LpStateArgs,
    LpStateAccounts,
    LpStateInstructionAccounts | LpStateInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<LpStateArgs, LpStateAccounts>) => {
        const allAccounts = {
            authority: config.accounts.authority,
            globalSettings: PDA.getGlobalSettings(),
            superAdmin: PDA.getSuperAdmin()
        };

        return {
            accounts: config.strict ? allAccounts : {
                authority: allAccounts.authority,
            },
            args: config.args.allow_trading
        };

    },
    getMethod: (program) => (args) => program.methods.setLpState(args),
};

export async function createSetLpStateInstruction(
    program: Program<WasabiSolana>,
    args: LpStateArgs,
    accounts: LpStateAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            tradeStateConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function setLpState(
    program: Program<WasabiSolana>,
    args: LpStateArgs,
    accounts: LpStateAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            tradeStateConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}

