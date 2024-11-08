import { TransactionInstruction, PublicKey, Connection } from '@solana/web3.js';
import { createJupiterSwapInstructions, getJupiterQuote } from './swapJupiter';
import { createRaydiumSwapInstructions, getRaydiumQuote } from './swapRaydium';

export type SwapMode = 'ExactIn' | 'ExactOut';
export type SwapProvider = 'jupiter' | 'raydium';

export type SwapInstructionGroup = {
    computeBudgetInstructions?: TransactionInstruction[];
    setupInstructions: TransactionInstruction[];
    swapInstruction: TransactionInstruction;
    cleanupInstructions: TransactionInstruction[];
    addressLookupTableAddresses?: string[];
};

export type CreateSwapInstructionArgs = {
    connection: Connection;
    inputMint: PublicKey;
    outputMint: PublicKey;
    amount: number;
    slippageBps: number;
    userPublicKey: PublicKey;
    swapMode?: SwapMode;
    preferredProvider?: SwapProvider;
    options?: {
        raydiumPoolId?: string;
        jupiterOptions?: {
            onlyDirectRoutes?: boolean;
            asLegacyTransaction?: boolean;
            maxAccounts?: number;
        };
    };
};

export async function createSwapInstructionGroup({
    connection,
    inputMint,
    outputMint,
    amount,
    slippageBps,
    userPublicKey,
    swapMode = 'ExactIn',
    preferredProvider = 'jupiter',
    options = {}
}: CreateSwapInstructionArgs): Promise<SwapInstructionGroup> {
    try {
        return await createProviderSwapInstructions(preferredProvider, {
            connection,
            inputMint,
            outputMint,
            amount,
            slippageBps,
            userPublicKey,
            swapMode,
            options
        });
    } catch (error) {
        console.error(`${preferredProvider} swap failed:`, error);

        const fallbackProvider = preferredProvider === 'jupiter' ? 'raydium' : 'jupiter';
        try {
            return await createProviderSwapInstructions(fallbackProvider, {
                connection,
                inputMint,
                outputMint,
                amount,
                slippageBps,
                userPublicKey,
                swapMode,
                options
            });
        } catch (fallbackError) {
            console.error(`${fallbackProvider} fallback failed:`, fallbackError);
            throw new Error('All swap providers failed');
        }
    }
}

async function createProviderSwapInstructions(
    provider: SwapProvider,
    params: {
        connection: Connection;
        inputMint: PublicKey;
        outputMint: PublicKey;
        amount: number;
        slippageBps: number;
        userPublicKey: PublicKey;
        swapMode: SwapMode;
        options?: {
            raydiumPoolId?: string;
            jupiterOptions?: {
                onlyDirectRoutes?: boolean;
                asLegacyTransaction?: boolean;
                maxAccounts?: number;
            };
        };
    }
): Promise<SwapInstructionGroup> {
    if (provider === 'jupiter') {
        return constructJupiterSwapInstructions(params);
    } else {
        return constructRaydiumSwapInstructions(params);
    }
}

async function constructJupiterSwapInstructions({
    inputMint,
    outputMint,
    amount,
    slippageBps,
    userPublicKey,
    swapMode,
    options
}: {
    connection: Connection;
    inputMint: PublicKey;
    outputMint: PublicKey;
    amount: number;
    slippageBps: number;
    userPublicKey: PublicKey;
    swapMode: SwapMode;
    options?: {
        jupiterOptions?: {
            onlyDirectRoutes?: boolean;
            asLegacyTransaction?: boolean;
            maxAccounts?: number;
        };
    };
}): Promise<SwapInstructionGroup> {
    const quoteResponse = await getJupiterQuote(
        inputMint,
        outputMint,
        amount,
        slippageBps,
        swapMode,
        options?.jupiterOptions
    );

    const jupiterInstructions = await createJupiterSwapInstructions({
        quoteResponse,
        userPublicKey,
        wrapUnwrapSOL: true
    });

    return {
        computeBudgetInstructions: jupiterInstructions.computeBudgetInstructions,
        setupInstructions: [
            ...(jupiterInstructions.setupInstructions || []),
            ...(jupiterInstructions.tokenLedgerInstruction
                ? [jupiterInstructions.tokenLedgerInstruction]
                : [])
        ],
        swapInstruction: jupiterInstructions.swapInstruction,
        cleanupInstructions: [
            ...(jupiterInstructions.cleanupInstruction
                ? [jupiterInstructions.cleanupInstruction]
                : [])
        ],
        addressLookupTableAddresses: jupiterInstructions.addressLookupTableAddresses
    };
}

async function constructRaydiumSwapInstructions({
    connection,
    inputMint,
    outputMint,
    amount,
    slippageBps,
    userPublicKey,
    swapMode,
    options
}: {
    connection: Connection;
    inputMint: PublicKey;
    outputMint: PublicKey;
    amount: number;
    slippageBps: number;
    userPublicKey: PublicKey;
    swapMode: SwapMode;
    options?: {
        raydiumPoolId?: string;
    };
}): Promise<SwapInstructionGroup> {
    if (!options?.raydiumPoolId) {
        throw new Error('Raydium pool ID is required');
    }

    const quoteResponse = await getRaydiumQuote(
        inputMint,
        outputMint,
        amount,
        slippageBps,
        options.raydiumPoolId,
        swapMode,
        connection
    );

    const raydiumInstructions = await createRaydiumSwapInstructions({
        quoteResponse,
        userPublicKey
    });

    return {
        computeBudgetInstructions: raydiumInstructions.computeBudgetInstructions,
        setupInstructions: raydiumInstructions.setupInstructions,
        swapInstruction: raydiumInstructions.swapInstruction,
        cleanupInstructions: raydiumInstructions.cleanupInstructions,
        addressLookupTableAddresses: raydiumInstructions.addressLookupTableAddresses
    };
}
