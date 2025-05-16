import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
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
        const permission = PDA.getAdmin(config.program.provider.publicKey);
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
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closeTakeProfitOrderConfig,
    }) as Promise<TransactionInstruction[]>;
}
