
import { IDL as JupiterIDL } from './jupiter';
import { SendTransactionError, VersionedTransaction } from '@solana/web3.js';
import * as idl from '../idl/wasabi_solana.json';
import {WasabiSolana} from "../index";
const WasabiIDL = idl as WasabiSolana;

type ErrorObject = {
    code: number;
    name: string;
    msg: string;
    expected: boolean;
    program: string;
};

const wasabiProgramId = "spicyTHtbmarmUxwFSHYpA8G4uP2nRNq38RReMpoZ9c";
const wasabiExpectedErrors = [
    6026, // LiquidationThresholdNotReached
    6017, // PriceTargetNotReached
];

const jupiterProgramId = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
const jupiterExpectedErrors = [
    6001, // SlippageToleranceExceeded
];

// Index errors by code for quick lookup
const wasabiErrorIndex: Record<number, ErrorObject> = WasabiIDL.errors.reduce((acc: Record<number, ErrorObject>, error) => {
    const expected = wasabiExpectedErrors.includes(error.code);
    acc[error.code] = {
        ...error,
        expected,
        program: 'Wasabi'
    }
    return acc;
}, {});

const findWasabiError = (code: number): ErrorObject | undefined => {
    return wasabiErrorIndex[code];
}

const jupiterErrorIndex: Record<number, ErrorObject> = JupiterIDL.errors.reduce((acc: Record<number, ErrorObject>, error) => {
    const expected = jupiterExpectedErrors.includes(error.code);
    acc[error.code] = {
        ...error,
        expected,
        program: 'Jupiter'
    };
    return acc;
}, {});

const findJupiterError = (code: number): ErrorObject | undefined => {
    return jupiterErrorIndex[code];
}

export const parseSendTransactionError = (error: SendTransactionError, transaction: VersionedTransaction): ErrorObject | undefined => {
    const message = error.transactionError.message;

    // Parse error messages like: "Transaction simulation failed: Error processing Instruction 3: custom program error: 0x1771"
    const match = message.match(/Instruction (\d+):.*(0x[0-9a-fA-F]+)/);

    if (match) {
        const instructionNumber = parseInt(match[1]); // First capture group
        const errorCode = parseInt(match[2], 16); // Second capture group, comes as hex

        // Validate instruction against parsed addresses
        const instruction = transaction.message.compiledInstructions[instructionNumber];
        const programId = transaction.message.staticAccountKeys[instruction.programIdIndex].toBase58();

        if (programId === wasabiProgramId) {
            return findWasabiError(errorCode);
        } else if (programId === jupiterProgramId) {
            return findJupiterError(errorCode);
        }
    }
    return undefined;
}