import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
} from '../base';
import { PDA, validateProviderPubkey } from '../utils';
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
        const payer = validateProviderPubkey(config.program.provider.publicKey)
        const permission = PDA.getAdmin(payer);
        const [trader, permissionAccount] = await Promise.all([
            config.program.account.position
                .fetch(config.accounts.position)
                .then((pos) => pos.trader),
            config.program.account.permission.fetch(permission).catch(() => null)
        ]);

        return {
            accounts: {
                closer: payer,
                trader,
                permission: permissionAccount ? permission : PDA.getSuperAdmin(),
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
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closeStopLossOrderConfig,
    }) as Promise<TransactionInstruction[]>;
}
