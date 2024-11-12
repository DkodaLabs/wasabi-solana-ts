import { TransactionInstruction, PublicKey, Connection } from '@solana/web3.js';
import { createJupiterSwapInstructions, getJupiterQuote } from './swapJupiter';
import { createRaydiumRouteSwapInstructions, getRaydiumRouteQuote } from './swapRaydium';

export type SwapMode = 'EXACT_IN' | 'EXACT_OUT';
export type SwapProvider = 'jupiter' | 'raydium';

export type SwapInstructionGroup = {
    computeBudgetInstructions?: TransactionInstruction[];
    setupInstructions: TransactionInstruction[];
    swapInstructions: TransactionInstruction[];
    cleanupInstructions: TransactionInstruction[];
    addressLookupTableAddresses?: string[];
};

export type CreateSwapInstructionArgs = {
    connection: Connection;
    inputMint: PublicKey;
    outputMint: PublicKey;
    amount: number;
    slippageBps: number;
    ownerPubkey: PublicKey;
    authorityPubkey?: PublicKey;
    swapMode?: SwapMode;
    preferredProvider?: SwapProvider;
    options?: {
        raydiumPoolIds?: string[];
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
    ownerPubkey,
    authorityPubkey,
    swapMode = 'EXACT_IN',
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
            ownerPubkey,
            authorityPubkey,
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
                ownerPubkey,
                authorityPubkey,
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
        ownerPubkey: PublicKey;
        authorityPubkey: PublicKey;
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
    ownerPubkey,
    authorityPubkey,
    swapMode,
    options
}: {
    connection: Connection;
    inputMint: PublicKey;
    outputMint: PublicKey;
    amount: number;
    slippageBps: number;
    ownerPubkey: PublicKey,
    authorityPubkey: PublicKey;
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
        ownerPubkey: ownerPubkey,
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
        swapInstructions: [jupiterInstructions.swapInstruction],
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
    ownerPubkey,
    authorityPubkey,
    swapMode,
    options
}: {
    connection: Connection;
    inputMint: PublicKey;
    outputMint: PublicKey;
    amount: number;
    slippageBps: number;
    ownerPubkey: PublicKey,
    authorityPubkey?: PublicKey;
    swapMode: SwapMode;
    options?: {
        raydiumPoolId?: string;
    };
}): Promise<SwapInstructionGroup> {
    if (!options?.raydiumPoolId) {
        throw new Error('Raydium pool ID is required');
    }

    const quoteResponse = await getRaydiumRouteQuote(
        inputMint,
        outputMint,
        amount,
        slippageBps,
        [options.raydiumPoolId],
        swapMode,
        connection
    );

    const raydiumInstructions = await createRaydiumRouteSwapInstructions({
        quoteResponse,
        ownerPubkey,
        authorityPubkey
    });

    return {
        computeBudgetInstructions: raydiumInstructions.computeBudgetInstructions,
        setupInstructions: raydiumInstructions.setupInstructions,
        swapInstructions: raydiumInstructions.swapInstructions,
        cleanupInstructions: raydiumInstructions.cleanupInstructions,
        addressLookupTableAddresses: raydiumInstructions.addressLookupTableAddresses
    };
}
