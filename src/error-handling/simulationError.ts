import { VersionedTransaction } from '@solana/web3.js';

export class SimulationError extends Error {
    constructor(
        public error: string,
        public transaction: VersionedTransaction,
        public logs?: string[]
    ) {
        super(`SimulationError: ${error}`);
    }
}
