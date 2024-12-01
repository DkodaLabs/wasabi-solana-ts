import { Program } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction, PublicKey } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type CloseStopLossOrderAccounts = {
    position: PublicKey;
};

type CloseStopLossOrderInstructionAccounts = {
    trader: PublicKey;
    position: PublicKey;
    stopLossOrder: PublicKey;
};

const closeStopLossOrderConfig: BaseMethodConfig<
    void,
    CloseStopLossOrderAccounts,
    CloseStopLossOrderInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, CloseStopLossOrderAccounts>) => {
        let permission = PDA.getAdmin(config.program.provider.publicKey);
        const [trader, permissionAccount] = await Promise.all([
            config.program.account.position
                .fetch(config.accounts.position)
                .then((pos) => pos.trader),
            config.program.account.permission.fetch(permission).catch(() => null)
        ]);

        return {
            accounts: {
                closer: config.program.provider.publicKey,
                trader,
                permission: permissionAccount ? PDA.getSuperAdmin() : permission,
                position: config.accounts.position,
                stopLossOrder: PDA.getStopLossOrder(config.accounts.position)
            }
        };
    },
    getMethod: (program) => () => program.methods.closeStopLossOrder()
};

export async function createCloseStopLossOrderInstruction(
    program: Program<WasabiSolana>,
    accounts: CloseStopLossOrderAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(program, accounts, closeStopLossOrderConfig, 'INSTRUCTION', {
            level: feeLevel,
            ixType: 'VAULT'
        })
    ) as Promise<TransactionInstruction[]>;
}

export async function closeStopLossOrder(
    program: Program<WasabiSolana>,
    accounts: CloseStopLossOrderAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(program, accounts, closeStopLossOrderConfig, 'TRANSACTION', {
            level: feeLevel,
            ixType: 'VAULT'
        })
    ) as Promise<TransactionSignature>;
}
