import {
    AddCollateralAccounts,
    AddCollateralArgs,
    ClosePositionAccounts,
    ClosePositionArgs,
    createClosePositionInstruction,
    createIncreaseShortPositionInstruction,
    createLiquidatePositionInstruction,
    createStopLossInstruction,
    DonateAccounts,
    DonateArgs
} from './instructions';

export * from './utils/index.js';
export * from './base/index.js';
export * from './instructions/index.js';
export * from './idl/index.js';
export * from './error-handling/index.js';
export * from './compute-budget/index.js';
export * from './transaction-builder/index.js';
export * from './solana-clients/index.js';
export * from './bundle-builder/index.js';
export * from './market-deployer/index.js';
import { WasabiSolana } from './idl/wasabi_solana.js';
import * as idl from './idl/wasabi_solana.json';

export { idl };
import { Program } from '@coral-xyz/anchor';
import { MintCache } from './utils/mintCache.js';
import {
    OpenPositionCleanupAccounts,
    OpenPositionSetupAccounts,
    OpenPositionSetupArgs
} from './instructions/openPosition.js';
import {
    createCloseLongPositionCleanupInstruction,
    createCloseLongPositionSetupInstruction
} from './instructions/closeLongPosition.js';
import {
    createOpenLongPositionCleanupInstruction,
    createOpenLongPositionSetupInstruction
} from './instructions/openLongPosition.js';
import { TransactionInstruction } from '@solana/web3.js';
import {
    createOpenShortPositionCleanupInstruction,
    createOpenShortPositionSetupInstruction
} from './instructions/openShortPosition.js';
import {
    ClosePositionCleanupAccounts,
    ClosePositionSetupAccounts,
    ClosePositionSetupArgs
} from './instructions/closePosition.js';
import {
    createCloseShortPositionCleanupInstruction,
    createCloseShortPositionSetupInstruction
} from './instructions/closeShortPosition.js';
import {
    createLiquidatePositionCleanupInstruction,
    createLiquidatePositionSetupInstruction
} from './instructions/liquidatePosition.js';
import {
    createTakeProfitCleanupInstruction,
    createTakeProfitSetupInstruction
} from './instructions/takeProfit.js';
import {
    createStopLossCleanupInstruction,
    createStopLossSetupInstruction
} from './instructions/stopLoss.js';
import {
    createOpenLongPositionInstruction,
    createOpenShortPositionInstruction,
    createAddCollateralToShortPositionInstruction,
    createTakeProfitInstruction,
    createIncreaseLongPositionSetupInstruction,
    createIncreaseShortPositionSetupInstruction,
    createDonateInstruction,
    createUpdateLongPositionInstruction,
    OpenPositionArgs,
    OpenPositionAccounts
} from './instructions';

export class Wasabi {
    program: Program<WasabiSolana>;
    mintCache: MintCache;

    constructor(program: Program<WasabiSolana>, mintCache: MintCache) {
        this.program = program;
        this.mintCache = mintCache;
    }

    // === V2 Ixes ===
    async createOpenLongPositionInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await createOpenLongPositionInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createOpenShortPositionInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await createOpenShortPositionInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createClosePositionInstruction(
        args: ClosePositionArgs,
        accounts: ClosePositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await createClosePositionInstruction(this.program, args, accounts, this.mintCache);
    }

    async createLiquidatePositionInstruction(
        args: ClosePositionArgs,
        accounts: ClosePositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await createLiquidatePositionInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createStopLossInstruction(
        args: ClosePositionArgs,
        accounts: ClosePositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await createStopLossInstruction(this.program, args, accounts, this.mintCache);
    }

    async createTakeProfitInstruction(
        args: ClosePositionArgs,
        accounts: ClosePositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await createTakeProfitInstruction(this.program, args, accounts, this.mintCache);
    }

    async createAddCollateralToShortPositionInstruction(
        args: AddCollateralArgs,
        accounts: AddCollateralAccounts
    ): Promise<TransactionInstruction[]> {
        return await createAddCollateralToShortPositionInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createUpdateLongPositionInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await createUpdateLongPositionInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createIncreaseShortPositionInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await createIncreaseShortPositionInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    // === V1 Ixes ===
    async createOpenLongPositionSetupInstruction(
        args: OpenPositionSetupArgs,
        accounts: OpenPositionSetupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createOpenLongPositionSetupInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createOpenLongPositionCleanupInstruction(
        accounts: OpenPositionCleanupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createOpenLongPositionCleanupInstruction(
            this.program,
            accounts,
            this.mintCache
        );
    }

    async createIncreaseLongPositionSetupInstruction(
        args: OpenPositionSetupArgs,
        accounts: OpenPositionSetupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createIncreaseLongPositionSetupInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createOpenShortPositionSetupInstruction(
        args: OpenPositionSetupArgs,
        accounts: OpenPositionSetupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createOpenShortPositionSetupInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createIncreaseShortPositionSetupInstruction(
        args: OpenPositionSetupArgs,
        accounts: OpenPositionSetupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createIncreaseShortPositionSetupInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createOpenShortPositionCleanupInstruction(accounts: OpenPositionCleanupAccounts) {
        return await createOpenShortPositionCleanupInstruction(
            this.program,
            accounts,
            this.mintCache
        );
    }

    async createCloseLongPositionSetupInstruction(
        args: ClosePositionSetupArgs,
        accounts: ClosePositionSetupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createCloseLongPositionSetupInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createCloseLongPositionCleanupInstruction(
        accounts: ClosePositionCleanupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createCloseLongPositionCleanupInstruction(
            this.program,
            accounts,
            this.mintCache
        );
    }

    async createCloseShortPositionSetupInstruction(
        args: ClosePositionSetupArgs,
        accounts: ClosePositionSetupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createCloseShortPositionSetupInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createCloseShortPositionCleanupInstruction(accounts: ClosePositionCleanupAccounts) {
        return await createCloseShortPositionCleanupInstruction(
            this.program,
            accounts,
            this.mintCache
        );
    }

    async createLiquidatePositionSetupInstruction(
        args: ClosePositionSetupArgs,
        accounts: ClosePositionSetupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createLiquidatePositionSetupInstruction(
            this.program,
            args,
            accounts,
            this.mintCache
        );
    }

    async createLiquidatePositionCleanupInstruction(accounts: ClosePositionCleanupAccounts) {
        return await createLiquidatePositionCleanupInstruction(
            this.program,
            accounts,
            this.mintCache
        );
    }

    async createTakeProfitSetupInstruction(
        args: ClosePositionSetupArgs,
        accounts: ClosePositionSetupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createTakeProfitSetupInstruction(this.program, args, accounts, this.mintCache);
    }

    async createTakeProfitCleanupInstruction(
        accounts: ClosePositionCleanupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createTakeProfitCleanupInstruction(this.program, accounts, this.mintCache);
    }

    async createStopLossSetupInstruction(
        args: ClosePositionSetupArgs,
        accounts: ClosePositionCleanupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createStopLossSetupInstruction(this.program, args, accounts, this.mintCache);
    }

    async createStopLossCleanupInstruction(
        accounts: ClosePositionCleanupAccounts
    ): Promise<TransactionInstruction[]> {
        return await createStopLossCleanupInstruction(this.program, accounts, this.mintCache);
    }

    async createDonateInstruction(
        args: DonateArgs,
        accounts: DonateAccounts
    ): Promise<TransactionInstruction[]> {
        return await createDonateInstruction(this.program, args, accounts, this.mintCache);
    }
}
