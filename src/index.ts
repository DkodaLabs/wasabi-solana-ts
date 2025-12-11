import {
    AddCollateralAccounts,
    AddCollateralArgs,
    ClosePositionAccounts,
    ClosePositionArgs,
    createClosePositionInstruction,
    createLiquidatePositionInstruction,
    createStopLossInstruction,
    DonateAccounts,
    DonateArgs,
    processAddCollateralToShortInstruction
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
export * from './cache/index.js';

export { idl };
import { Program } from '@coral-xyz/anchor';
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
    createTakeProfitInstruction,
    createIncreaseLongPositionSetupInstruction,
    createIncreaseShortPositionSetupInstruction,
    createDonateInstruction,
    OpenPositionArgs,
    OpenPositionAccounts
} from './instructions';
import { processPositionInstruction } from './instructions/shared';
import { processAddCollateralToLongInstruction } from './instructions/addCollateralToLongPosition';
import {TokenMintCache} from "./cache/TokenMintCache";

export class Wasabi {
    program: Program<WasabiSolana>;
    mintCache: TokenMintCache;

    constructor(program: Program<WasabiSolana>, mintCache: TokenMintCache) {
        this.program = program;
        this.mintCache = mintCache;
    }

    // === V2 Ixes ===
    async createOpenLongPositionInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await processPositionInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            {
                useShares: false,
                isUpdate: false,
                isShort: false,
                methodName: 'OpenLongPosition'
            }
        );
    }

    async createOpenLongWithSharesInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await processPositionInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            {
                useShares: true,
                isUpdate: false,
                isShort: false,
                methodName: 'OpenLongWithShares'
            }
        );
    }

    async createOpenShortPositionInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await processPositionInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            {
                useShares: false,
                isUpdate: false,
                isShort: true,
                methodName: 'OpenShortPosition'
            }
        );
    }

    async createOpenShortWithSharesInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await processPositionInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            {
                useShares: true,
                isUpdate: false,
                isShort: true,
                methodName: 'OpenShortWithShares'
            }
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
        return await processAddCollateralToShortInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            false,
        );
    }

    async createAddCollateralToShortWithSharesInstruction(
        args: AddCollateralArgs,
        accounts: AddCollateralAccounts
    ): Promise<TransactionInstruction[]> {
        return await processAddCollateralToShortInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            true,
        );
    }
    async createAddCollateralToLongPositionInstruction(

        args: AddCollateralArgs,
        accounts: AddCollateralAccounts
    ): Promise<TransactionInstruction[]> {
        return await processAddCollateralToLongInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            false,
        );
    }

    async createAddCollateralToLongWithSharesInstruction(
        args: AddCollateralArgs,
        accounts: AddCollateralAccounts
    ): Promise<TransactionInstruction[]> {
        return await processAddCollateralToLongInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            true,
        );
    }

    async createUpdateLongPositionInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await processPositionInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            {
                useShares: false,
                isUpdate: true,
                isShort: false,
                methodName: 'UpdateLongPosition'
            }
        );
    }

    async createUpdateLongWithSharesInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await processPositionInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            {
                useShares: true,
                isUpdate: true,
                isShort: false,
                methodName: 'UpdateLongWithShares'
            }
        );
    }

    async createIncreaseShortPositionInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await processPositionInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            {
                useShares: false,
                isUpdate: true,
                isShort: true,
                methodName: 'IncreaseShortPosition'
            }
        );
    }

    async createIncreaseShortWithSharesInstruction(
        args: OpenPositionArgs,
        accounts: OpenPositionAccounts
    ): Promise<TransactionInstruction[]> {
        return await processPositionInstruction(
            {
                program: this.program,
                args,
                accounts,
                mintCache: this.mintCache
            },
            {
                useShares: true,
                isShort: true,
                isUpdate: true,
                methodName: 'IncreaseShortWithShares'
            }
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
