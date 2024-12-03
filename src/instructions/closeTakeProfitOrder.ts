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

export type CloseTakeProfitOrderAccounts = {
    position: PublicKey;
};

type CloseTakeProfitOrderInstructionAccounts = {
    trader: PublicKey;
    position: PublicKey;
    takeProfitOrder: PublicKey;
};

const closeTakeProfitOrderConfig: BaseMethodConfig<
    void,
    CloseTakeProfitOrderAccounts,
    CloseTakeProfitOrderInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, CloseTakeProfitOrderAccounts>) => {
        let permission = PDA.getAdmin(config.program.provider.publicKey);
        const [trader, permissionAccount] = await Promise.all([
            config.program.account.position
                .fetch(config.accounts.position)
                .then((pos) => pos.trader),
            config.program.account.permission.fetch(permission).catch(() => null)
        ]);

        const accounts = {
            closer: config.program.provider.publicKey,
            trader,
            permission: permissionAccount ? permission : PDA.getSuperAdmin(),
            position: config.accounts.position,
            takeProfitOrder: PDA.getTakeProfitOrder(config.accounts.position)
        };
        return {
            accounts
        };
    },
    getMethod: (program) => () => program.methods.closeTakeProfitOrder()
};

export async function createCloseTakeProfitOrderInstruction(
    program: Program<WasabiSolana>,
    accounts: CloseTakeProfitOrderAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(program, accounts, closeTakeProfitOrderConfig, 'INSTRUCTION', {
            level: feeLevel,
            ixType: 'VAULT'
        })
    ) as Promise<TransactionInstruction[]>;
}

export async function closeTakeProfitOrder(
    program: Program<WasabiSolana>,
    accounts: CloseTakeProfitOrderAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(program, accounts, closeTakeProfitOrderConfig, 'TRANSACTION', {
            level: feeLevel,
            ixType: 'VAULT'
        })
    ) as Promise<TransactionSignature>;
}
