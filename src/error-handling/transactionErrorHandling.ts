import { IDL as JupiterIDL } from './jupiter';
import {
    SendTransactionError,
    VersionedTransaction,
    TransactionInstruction
} from '@solana/web3.js';
import * as idl from '../idl/wasabi_solana.json';
import { WasabiSolana } from '../index';

const WasabiIDL = idl as WasabiSolana;

export class SimulationError extends Error {
    constructor(
        public error: string,
        public transaction: VersionedTransaction,
        public logs?: string[]
    ) {
        super(`SimulationError: ${error}`);
    }
}

type ErrorObject = {
    code: number;
    name: string;
    msg: string;
    expected: boolean;
    program: string;
};

const wasabiProgramId = 'spicyTHtbmarmUxwFSHYpA8G4uP2nRNq38RReMpoZ9c';
const wasabiExpectedErrors = [
    6015, // PrincipalTooHigh
    6017, // PriceTargetNotReached
    6026 // LiquidationThresholdNotReached
];

const jupiterProgramId = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const jupiterExpectedErrors = [
    6001 // SlippageToleranceExceeded
];

// Index errors by code for quick lookup
const wasabiErrorIndex: Record<number, ErrorObject> = WasabiIDL.errors.reduce(
    (acc: Record<number, ErrorObject>, error) => {
        const expected = wasabiExpectedErrors.includes(error.code);
        acc[error.code] = {
            ...error,
            expected,
            program: 'Wasabi'
        };
        return acc;
    },
    {}
);

const findWasabiError = (code: number): ErrorObject | undefined => {
    return wasabiErrorIndex[code];
};

const jupiterErrorIndex: Record<number, ErrorObject> = JupiterIDL.errors.reduce(
    (acc: Record<number, ErrorObject>, error) => {
        const expected = jupiterExpectedErrors.includes(error.code);
        acc[error.code] = {
            ...error,
            expected,
            program: 'Jupiter'
        };
        return acc;
    },
    {}
);

const findJupiterError = (code: number): ErrorObject | undefined => {
    return jupiterErrorIndex[code];
};

export const parseSendTransactionError = (
    error: SendTransactionError,
    transaction: VersionedTransaction
): ErrorObject | undefined => {
    const message = error.transactionError.message;

    // Parse error messages like: "Transaction simulation failed: Error processing Instruction 3: custom program error: 0x1771"
    const match = message.match(/Instruction (\d+):.*(0x[0-9a-fA-F]+)/);

    if (match) {
        const instructionNumber = parseInt(match[1]); // First capture group
        const errorCode = parseInt(match[2], 16); // Second capture group, comes as hex
        return parseError(instructionNumber, errorCode, transaction);
    }

    return matchComputeError(message);
};

export const parseError = (
    instructionNumber: number,
    errorCode: number,
    transaction: VersionedTransaction
): ErrorObject | undefined => {
    // Parse error messages like: "Transaction simulation failed: Error processing Instruction 3: custom program error: 0x1771"
    // Validate instruction against parsed addresses
    const instruction = transaction.message.compiledInstructions[instructionNumber];
    const programId = transaction.message.staticAccountKeys[instruction.programIdIndex].toBase58();

    const systemError = parseSystemError(errorCode, programId);
    if (systemError) {
        return systemError;
    }

    if (programId === wasabiProgramId) {
        return findWasabiError(errorCode);
    } else if (programId === jupiterProgramId) {
        return findJupiterError(errorCode);
    }

    return undefined;
};

export const parseSimulationError = (
    error: SimulationError,
    transaction: VersionedTransaction
): ErrorObject | undefined => {
    const message = JSON.stringify(error.error);
    const match = message.match(/\[(\d+),.*Custom.*?(\d+)/);

    if (match) {
        const instructionNumber = parseInt(match[1]);
        const errorCode = parseInt(match[2]);
        return parseError(instructionNumber, errorCode, transaction);
    }

    return matchComputeError(message);
};

const matchComputeError = (message: string): ErrorObject | undefined => {
    const match = message.match(/.*"ProgramFailedToComplete"/);

    if (match) {
        return {
            code: 0,
            name: 'ProgramFailedToComplete',
            msg: 'Program failed to complete',
            expected: false,
            program: 'ComputeBudget'
        };
    }

    return undefined;
};

const parseSystemError = (code: number, programId: string): ErrorObject | undefined => {
    const program =
        programId === wasabiProgramId
            ? 'Wasabi'
            : programId === jupiterProgramId
            ? 'Jupiter'
            : 'System';

    if (code === 1) {
        return {
            code,
            name: 'InsufficientFunds',
            msg: 'Insufficient Funds',
            expected: true,
            program
        };
    } else if (code === 4) {
        return {
            code,
            name: 'OwnerDoesNotMatch',
            msg: 'Owner does not match',
            expected: false,
            program
        };
    }

    return undefined;
};

export const matchError = (error: Error): ErrorObject | undefined => {
    const msg = error.message;

    const errorPatterns: Record<string, ErrorObject> = {
        '.*BlockhashNotFound': {
            code: 0,
            name: 'BlockhashNotFound',
            msg: 'RPC Error: Failed to find blockhash',
            expected: true,
            program: 'System'
        },
        '.*VersionedTransaction too large:.*': {
            code: 0,
            name: 'TransactionTooLarge',
            msg: 'Routing Error: Failed to find route',
            expected: true,
            program: ''
        },
        '.*encoding overruns Uint8Array.*': {
            code: 0,
            name: 'EncodingOverrunsUint8Array',
            msg: 'Routing Error: Failed to find route',
            expected: true,
            program: ''
        },
        '.*InsufficientFundsForFee.*': {
            code: 0,
            name: 'InsufficientFundsForFee',
            msg: 'Fee Error: Insufficient funds for fee',
            expected: true,
            program: 'ComputeBudget'
        },
        '.*InsufficientFundsForRent.*': {
            code: 0,
            name: 'InsufficientFundsForRent',
            msg: 'Rent Error: Insufficient funds for rent',
            expected: true,
            program: 'System'
        },
        '.*AccountNotFound.*': {
            code: 0,
            name: 'AccountNotFound',
            msg: 'Account Error: Account does not exist',
            expected: false,
            program: 'Wasabi'
        },
        '.*account does not exist or has no data.*': {
            code: 0,
            name: 'AccountNotFound',
            msg: 'Account Error: Account does not exist',
            expected: false,
            program: 'Wasabi'
        },
        '.*simple AMMs are not supported with shared accounts.*': {
            code: 0,
            name: 'SimpleAMM',
            msg: 'Jupiter Error: Simple AMMs not supported for shared accounts',
            expected: true,
            program: 'Jupiter'
        },
        '.*No enough tick arrays.*': {
            code: 0,
            name: 'InsufficientTickArrays',
            msg: 'Raydium Error: Insufficient tick arrays initialized',
            expected: true,
            program: 'Raydium'
        },
        '.*"error":"RPC client error".*': {
            code: 0,
            name: 'RaydiumRpcClientError',
            msg: 'Raydium Error: Rpc client error',
            expected: false,
            program: 'Raydium RPC'
        },
        '.*"error":"Could not find any route".*': {
            code: 0,
            name: 'JupiterNoRoutes',
            msg: 'Jupiter Error: No routes found',
            expected: true,
            program: 'Jupiter'
        }
    };

    for (const [pattern, errorObj] of Object.entries(errorPatterns)) {
        if (msg.match(pattern)) {
            return errorObj;
        }
    }

    return undefined;
};

export const getFailingSwapProgram = (instructions: TransactionInstruction[]): string => {
    let failingProgramIdx = 0;
    for (let i = 0; i < instructions.length; i++) {
        if (instructions[i].programId.toBase58().localeCompare(wasabiProgramId) === 0) {
            failingProgramIdx = i + 1;
            break;
        }
    }
    const failingProgram = instructions[failingProgramIdx].programId.toBase58();
    return failingProgram === wasabiProgramId ? 'Wasabi' : jupiterProgramId ? 'Jupiter' : 'Raydium';
};
