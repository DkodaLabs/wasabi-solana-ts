export * from './utils/index.js';
export * from './base/index.js';
export * from './instructions/index.js';
export * from './idl/index.js';
export * from './error-handling/index.js';
export * from './compute-budget/index.js';
export * from './transaction-builder/index.js'
export * from './solana-clients/index.js';
export * from './bundle-builder/index.js';
export * from './market-deployer/index.js';
import { WasabiSolana } from './idl/wasabi_solana.js';
import * as idl from './idl/wasabi_solana.json';
export { idl };
import { Program } from '@coral-xyz/anchor';
import MintCache from './utils/mintCache.js';
import { OpenPositionCleanupAccounts, OpenPositionSetupAccounts, OpenPositionSetupArgs } from './instructions/openPosition.js';
import { createCloseLongPositionCleanupInstruction, createCloseLongPositionSetupInstruction } from './instructions/closeLongPosition.js';
import { createOpenLongPositionCleanupInstruction, createOpenLongPositionSetupInstruction } from './instructions/openLongPosition.js';
import { TransactionInstruction } from '@solana/web3.js';
import { createOpenShortPositionCleanupInstruction, createOpenShortPositionSetupInstruction } from './instructions/openShortPosition.js';
import { ClosePositionCleanupAccounts, ClosePositionSetupAccounts, ClosePositionSetupArgs } from './instructions/closePosition.js';
import { createCloseShortPositionCleanupInstruction, createCloseShortPositionSetupInstruction } from './instructions/closeShortPosition.js';
import { createLiquidatePositionCleanupInstruction, createLiquidatePositionSetupInstruction } from './instructions/liquidatePosition.js';
import { createTakeProfitCleanupInstruction, createTakeProfitSetupInstruction } from './instructions/takeProfit.js';
import { createStopLossCleanupInstruction, createStopLossSetupInstruction } from './instructions/stopLoss.js';

export class Wasabi {
    program: Program<WasabiSolana>;
    mintCache: MintCache;

    constructor(
        program: Program<WasabiSolana>,
        mintCache: MintCache
    ) {
        this.program = program;
        this.mintCache = mintCache;
    }

    async createOpenLongPositionSetupInstruction(args: OpenPositionSetupArgs, accounts: OpenPositionSetupAccounts): Promise<TransactionInstruction[]> {
        return await createOpenLongPositionSetupInstruction(this.program, args, accounts);
    };

    async createOpenLongPositionCleanupInstruction(accounts: OpenPositionCleanupAccounts): Promise<TransactionInstruction[]> {
        return await createOpenLongPositionCleanupInstruction(this.program, accounts);
    };

    async createOpenShortPositionSetupInstruction(args: OpenPositionSetupArgs, accounts: OpenPositionSetupAccounts): Promise<TransactionInstruction[]> {
        return await createOpenShortPositionSetupInstruction(this.program, args, accounts);
    };

    async createOpenShortPositionCleanupInstruction(accounts: OpenPositionCleanupAccounts) {
        return await createOpenShortPositionCleanupInstruction(this.program, accounts);
    };

    async createCloseLongPositionSetupInstruction(args: ClosePositionSetupArgs, accounts: ClosePositionSetupAccounts): Promise<TransactionInstruction[]> {
        return await createCloseLongPositionSetupInstruction(this.program, args, accounts);
    };

    async createCloseLongPositionCleanupInstruction(accounts: ClosePositionCleanupAccounts): Promise<TransactionInstruction[]> {
        return await createCloseLongPositionCleanupInstruction(this.program, accounts);
    };

    async createCloseShortPositionSetupInstruction(args: ClosePositionSetupArgs, accounts: ClosePositionSetupAccounts): Promise<TransactionInstruction[]> {
        return await createCloseShortPositionSetupInstruction(this.program, args, accounts);
    };

    async createCloseShortPositionCleanupInstruction(accounts: ClosePositionCleanupAccounts) {
        return await createCloseShortPositionCleanupInstruction(this.program, accounts);
    };

    async createLiquidatePositionSetupInstruction(args: ClosePositionSetupArgs, accounts: ClosePositionSetupAccounts): Promise<TransactionInstruction[]> {
        return await createLiquidatePositionSetupInstruction(this.program, args, accounts);
    };

    async createLiquidatePositionCleanupInstruction(accounts: ClosePositionCleanupAccounts) {
        return await createLiquidatePositionCleanupInstruction(this.program, accounts);
    };

    async createTakeProfitSetupInstruction(args: ClosePositionSetupArgs, accounts: ClosePositionSetupAccounts): Promise<TransactionInstruction[]> {
        return await createTakeProfitSetupInstruction(this.program, args, accounts);
    };

    async createTakeProfitCleanupInstruction(accounts: ClosePositionCleanupAccounts): Promise<TransactionInstruction[]> {
        return await createTakeProfitCleanupInstruction(this.program, accounts);
    };

    async createStopLossSetupInstruction(args: ClosePositionSetupArgs, accounts: ClosePositionCleanupAccounts): Promise<TransactionInstruction[]> {
        return await createStopLossSetupInstruction(this.program, args, accounts);
    };
    async createStopLossCleanupInstruction(accounts: ClosePositionCleanupAccounts): Promise<TransactionInstruction[]> {
        return await createStopLossCleanupInstruction(this.program, accounts);
    };
}
