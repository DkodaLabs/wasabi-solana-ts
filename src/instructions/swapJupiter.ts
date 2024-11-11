import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { SwapMode } from './swap';
import fetch from 'cross-fetch';

type MarketInfo = {
    id: string;
    label: string;
    inputMint: string;
    outputMint: string;
    notEnoughLiquidity: boolean;
    inAmount: string;
    outAmount: string;
    lpFee: {
        amount: string;
        mint: string;
        pct: number;
    };
    platformFee: {
        amount: string;
        mint: string;
        pct: number;
    };
    priceImpactPc: number;
};

type Route = {
    inAmount: string;
    outAmount: string;
    priceImpactPc: number;
    marketInfos: MarketInfo[];
    amount: string;
    slippageBps: number;
    otherAmountThreshold: string;
    swapMode: SwapMode;
    fees: {
        signatureFee: number;
        openOrdersDeposits: number[];
        ataDeposits: number[];
        totalFeeAndDeposits: number;
        minimumSOLForTransaction: number;
    };
    accountMetas: {
        pubkey: string;
        isSigner: boolean;
        isWritable: boolean;
    }[];
};

type TokenInfo = {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI?: string;
    tags?: string[];
};

type QuoteResponse = {
    inputMint: string;
    outputMint: string;
    amount: string;
    swapMode: SwapMode;
    slippageBps: number;
    otherAmountThreshold: string;
    routes: Route[];
    contextSlot: number;
    timeTaken: number;
    priceImpactPct: number;
    inputTokenInfo: TokenInfo;
    outputTokenInfo: TokenInfo;
};

type JupiterInstructionResponse = {
    tokenLedgerInstruction?: TransactionInstruction;
    computeBudgetInstructions?: TransactionInstruction[];
    setupInstructions?: TransactionInstruction[];
    swapInstruction: TransactionInstruction;
    cleanupInstruction?: TransactionInstruction;
    addressLookupTableAddresses?: string[];
};

type CreateSwapInstructionArgs = {
    quoteResponse: QuoteResponse;
    ownerPubkey: PublicKey;
    authorityPubkey?: PublicKey;
    wrapUnwrapSOL?: boolean;
    computeUnitPriceMicroLamports?: number;
    computeUnitsLimit?: number;
};

export async function getJupiterQuote(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: number,
    slippageBps: number,
    swapMode: SwapMode,
    options?: {
        onlyDirectRoutes?: boolean;
        asLegacyTransaction?: boolean;
        maxAccounts?: number;
    }
): Promise<QuoteResponse> {
    const url = new URL('https://quote-api.jup.ag/v6/quote');

    const args: Record<string, string> = {
        inputMint: inputMint.toString(),
        outputMint: outputMint.toString(),
        amount: amount.toString(),
        slippageBps: slippageBps.toString()
    };

    if (swapMode === 'EXACT_OUT') {
        args.swapMode = 'ExactOut';
    }

    if (options) {
        if (options.onlyDirectRoutes) {
            args.onlyDirectRoutes = 'true';
        }
        if (options.asLegacyTransaction) {
            args.asLegacyTransaction = 'true';
        }
        if (options.maxAccounts) {
            args.maxAccounts = options.maxAccounts.toString();
        }
    }

    url.search = new URLSearchParams(args).toString();

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status} - ${response.statusText}`);
    }

    return response.json() as Promise<QuoteResponse>;
}

export async function createJupiterSwapInstructions({
    quoteResponse,
    ownerPubkey,
    authorityPubkey,
    wrapUnwrapSOL = true,
    computeUnitPriceMicroLamports,
    computeUnitsLimit
}: CreateSwapInstructionArgs): Promise<JupiterInstructionResponse> {
    const body: Record<string, any> = {
        quoteResponse,
        userPubkey: ownerPubkey.toString(),
        wrapUnwrapSOL,
        computeUnitPriceMicroLamports,
        computeUnitsLimit
    };

    if (authorityPubkey) {
        body.delegateWallet = authorityPubkey.toString();
        body.useDelegate = true;
    }

    const response = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Swap instruction API error: ${response.status} - ${response.statusText}`);
    }

    return response.json() as Promise<JupiterInstructionResponse>;
}
