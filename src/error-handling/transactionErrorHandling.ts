import { IDL as JupiterIDL } from './jupiter';
import { IDL as TitanIDL } from './titan';
import { IDL as RaydiumIDL } from './raydium';
import { IDL as DFlowIDL } from './dflow';
import {
    SendTransactionError,
    VersionedTransaction,
    SystemProgram
} from '@solana/web3.js';
import * as WasabiIDL from '../idl/wasabi_solana.json';

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

export const NOT_ENOUGH_SOL_ERROR = "Insufficient SOL for transaction fees. Please add more SOL and try again.";

type ProgramIDL = {
    address: string;
    errors: {
        code: number;
        name: string;
        msg: string;
    }[];
};

const IDLS: ProgramIDL[] = [
    WasabiIDL as ProgramIDL,
    JupiterIDL as ProgramIDL,
    TitanIDL as ProgramIDL,
    RaydiumIDL as ProgramIDL,
    DFlowIDL as ProgramIDL
];

const programToExpectedErrors: Record<string, number[]> = {
    [WasabiIDL.address]: [
        6004, // MinTokensNotMet
        6015, // PrincipalTooHigh
        6017, // PriceTargetNotReached
        6026 // LiquidationThresholdNotReached
    ],
    [JupiterIDL.address]: [
        6001 // SlippageToleranceExceeded
    ],
    [TitanIDL.address]: [
        6008 // LessThanMinimumAmountOut
    ],
    [RaydiumIDL.address]: [
        6022, // TooLittleOutputReceived
        6023, // TooMuchInputPaid
    ],
    [DFlowIDL.address]: [
        15001, // SlippageLimitExceeded
    ]
};

const programErrors: Record<string, Record<number, ErrorObject>> = {};
const programNames: Record<string, string> = {
    [WasabiIDL.address]: 'Wasabi',
    [JupiterIDL.address]: 'Jupiter',
    [TitanIDL.address]: 'Titan',
    [RaydiumIDL.address]: 'Raydium',
    [DFlowIDL.address]: 'DFlow',
    [SystemProgram.programId.toBase58()]: 'System'
};

for (const idl of IDLS) {
    const expectedErrors = programToExpectedErrors[idl.address] ?? [];

    programErrors[idl.address] = idl.errors.reduce(
      (acc: Record<number, ErrorObject>, error) => {
          acc[error.code] = {
              ...error,
              expected: expectedErrors.includes(error.code),
              program: programNames[idl.address] ?? 'Unknown'
          };
          return acc;
      },
      {}
    );
}

const findProgramError = (programId: string, code: number): ErrorObject | undefined => {
    if (code === 0) {
        return {
            code,
            name: 'InsufficientFundsForRent',
            msg: 'Insufficient SOL to pay for rent',
            expected: true,
            program: programNames[programId] ?? 'Unknown'
        };
    } else if (code === 1) {
        return {
            code,
            name: 'InsufficientFunds',
            msg: 'Insufficient Funds',
            expected: true,
            program: programNames[programId] ?? 'Unknown'
        };
    } else if (code === 4) {
        return {
            code,
            name: 'OwnerDoesNotMatch',
            msg: 'Owner does not match',
            expected: false,
            program: programNames[programId] ?? 'Unknown'
        };
    }

    return programErrors[programId]?.[code];
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

    return findProgramError(programId, errorCode);
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

export const parseErrorLogs = (logs: string[] | undefined): ErrorObject | undefined => {
    if (!logs || logs.length < 1) {
        return undefined;
    }

    for (const log of logs) {
        const panicRegex = /panicked at/;

        const didPanic = panicRegex.test(log);

        if (didPanic) {
            return {
                code: 0,
                name: 'TokenAccountNotInitialized',
                msg: 'An intermediary token account is not initialized',
                expected: false,
                program: 'Wasabi'
            }
        }

        const match = log.match(/^Program ([a-zA-Z0-9]+) failed: (?:.*?): (0x[0-9a-fA-F]+)$/);
        if (match) {
            const [_, failingProgramId, errorHex] = match;
            const errorCode = parseInt(errorHex);
            return findProgramError(failingProgramId, errorCode);
        }
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
            program: 'System'
        },
        '.*encoding overruns Uint8Array.*': {
            code: 0,
            name: 'EncodingOverrunsUint8Array',
            msg: 'Routing Error: Failed to find route',
            expected: true,
            program: 'System'
        },
        '.*InsufficientFundsForFee.*': {
            code: 0,
            name: 'InsufficientFundsForFee',
            msg: NOT_ENOUGH_SOL_ERROR,
            expected: true,
            program: 'ComputeBudget'
        },
        '.*InsufficientFundsForRent.*': {
            code: 0,
            name: 'InsufficientFundsForRent',
            msg: NOT_ENOUGH_SOL_ERROR,
            expected: true,
            program: 'System'
        },
        '.*AccountNotFound.*': {
            code: 0,
            name: 'AccountNotFound',
            msg: 'Account Error: Account does not exist',
            expected: false,
            program: 'System'
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