import { PublicKey, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
import { SwapInstructionGroup, SwapMode } from './swap';
import { JsonTransactionInstruction, mapJsonIx, mapJsonIxBase64 } from './swapUtils';
import fetch from 'cross-fetch';

type PlatformFee = {
  amount?: string;
  feeBps?: number;
}

type SwapInfo = {
  ammKey: string;
  label?: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

type RoutePlan = {
  swapInfo: SwapInfo;
  percent: number;
}

type JupiterQuoteResponse = {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: SwapMode;
  slippageBps: number;
  platformFee?: PlatformFee;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
};

type JupiterInstructionResponse = {
  tokenLedgerInstruction?: JsonTransactionInstruction;
  computeBudgetInstructions?: JsonTransactionInstruction[];
  setupInstructions?: JsonTransactionInstruction[];
  swapInstruction: JsonTransactionInstruction;
  cleanupInstruction?: JsonTransactionInstruction;
  addressLookupTableAddresses?: string[];
};

type CreateSwapInstructionArgs = {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: PublicKey;
  destinationTokenAccount?: PublicKey;
  delegateWallet?: PublicKey;
  wrapAndUnwrapSol?: boolean;
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
): Promise<JupiterQuoteResponse> {
  const url = new URL('https://jupiter-swap-api.quiknode.pro/F86388BDD952/quote');
  const params = new URLSearchParams();
  params.set('inputMint', inputMint.toString());
  params.set('outputMint', outputMint.toString());
  params.set('amount', amount.toString());
  params.set('slippageBps', slippageBps.toString());
  if (swapMode === 'EXACT_OUT') {
    params.set('swapMode', 'ExactOut');
  }
  if (options) {
    if (options.onlyDirectRoutes) {
      params.set('onlyDirectRoutes', 'true');
    }
    if (options.asLegacyTransaction) {
      params.set('asLegacyTransaction', 'true');
    }
    if (swapMode !== 'EXACT_OUT' && options.maxAccounts) {
      params.set('maxAccounts', options.maxAccounts.toString());
    }
  }
  url.search = params.toString();

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jupiter API error: ${response.status} - ${response.statusText}: ${body}`);
  }

  return response.json() as Promise<JupiterQuoteResponse>;
}

export async function createJupiterSwapInstructions({
  quoteResponse,
  userPublicKey,
  wrapAndUnwrapSol = false,
  computeUnitPriceMicroLamports,
  computeUnitsLimit
}: CreateSwapInstructionArgs): Promise<SwapInstructionGroup> {
  const body: Record<string, any> = {
    quoteResponse,
    userPublicKey: userPublicKey.toString(),
    wrapAndUnwrapSol,
    computeUnitPriceMicroLamports,
    computeUnitsLimit,
    useSharedAccounts: true,
    skipUserAccountsRpcCalls: true
  };

  const response = await fetch('https://jupiter-swap-api.quiknode.pro/F86388BDD952/swap-instructions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Swap instruction API error: ${response.status} - ${response.statusText}`);
  }

  const ixResponse = await response.json() as JupiterInstructionResponse;

  const ix: SwapInstructionGroup = {
    setupInstructions: ixResponse.setupInstructions?.map(mapJsonIx) || [],
    swapInstruction: mapJsonIxBase64(ixResponse.swapInstruction),
    cleanupInstruction: mapJsonIx(ixResponse.cleanupInstruction) || undefined,
    addressLookupTableAddresses: ixResponse.addressLookupTableAddresses,
  };

  return ix;
}

export async function createJupiterDirectSwap(
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: number,
  slippageBps: number,
  swapMode: SwapMode,
  userPublicKey: PublicKey,
): Promise<VersionedTransaction> {
  const quoteResponse = await getJupiterQuote(inputMint, outputMint, amount, slippageBps, swapMode);
  return await createJupiterSwapTransaction(quoteResponse, userPublicKey);
}

export async function createJupiterSwapTransaction(
  quoteResponse: JupiterQuoteResponse, 
  userPublicKey: PublicKey
): Promise<VersionedTransaction> {
  const body: Record<string, any> = {
    quoteResponse,
    userPublicKey: userPublicKey.toString(),
    useSharedAccounts: true,
    skipUserAccountsRpcCalls: true
  };

  const { swapTransaction } = await (
    await fetch('https://jupiter-swap-api.quiknode.pro/F86388BDD952/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  ).json();

  const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
  return VersionedTransaction.deserialize(swapTransactionBuf);
}
