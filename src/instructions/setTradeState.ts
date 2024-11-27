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

export type TradeStateArgs = {
    allow_trading: boolean;
};

export type TradeStateAccounts = {
    authority: PublicKey;
}

type TradeStateInstructionAccounts = TradeStateAccounts;

type TradeStateInstructionAccountsStrict = {
    authority: PublicKey,
    globalSettings: PublicKey,
    superAdmin: PublicKey,
};


const tradeStateConfig: BaseMethodConfig<
    TradeStateArgs,
    TradeStateAccounts,
    TradeStateInstructionAccounts | TradeStateInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<TradeStateArgs, TradeStateAccounts>) => {
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
    getMethod: (program) => (args) => program.methods.setTradingState(args),
};

export async function createSetTradeStateInstruction(
    program: Program<WasabiSolana>,
    args: TradeStateArgs,
    accounts: TradeStateAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            tradeStateConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function setTradeState(
    program: Program<WasabiSolana>,
    args: TradeStateArgs,
    accounts: TradeStateAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            tradeStateConfig,
            'TRANSACTION',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
