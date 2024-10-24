import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { WasabiSolana } from "../../idl/wasabi_solana";
import {
    SwapSide,
    Cluster,
    Raydium,
    ApiV3PoolInfoStandardItem,
    AmmV4Keys,
    AmmRpcData,
    makeAMMSwapInstruction,
    SwapInstructionParams,
} from "@raydium-io/raydium-sdk-v2";

export type PositionAction = "open" | "close";
export type RaydiumSwapArgs = {
    amount: number, // u64
    slippage: number,
    cluster: Cluster, //"devnet | mainnet" - shouldnt have this - different microservice for mainnet & testnet
    side: SwapSide, // "in | out" - exact in / exact out
    positionAction: PositionAction,
}

export type RaydiumSwapAccounts = {
    wallet: PublicKey,
    amm: PublicKey,
    quote: PublicKey,
    base: PublicKey,
    tradePool: PublicKey,
}

//const RAYDIUM_V4_MAINNET = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
//const RAYDIUM_V4_DEVNET = new PublicKey("HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8");

// TODO: Check and refactor - this is fine for an initial implementation
export async function createRaydiumSwapInstruction(
    program: Program<WasabiSolana>,
    args: RaydiumSwapArgs,
    accounts: RaydiumSwapAccounts,
): Promise<TransactionInstruction> {
    const [raydium, tradePoolInfo, [baseMintInfo, quoteMintInfo]] = await Promise.all([
        Raydium.load({
            owner: program.provider.publicKey,
            connection: program.provider.connection,
            cluster: args.cluster,
            disableFeatureCheck: true,
            disableLoadToken: false,
            blockhashCommitment: "confirmed",
        }),
        program.account.basePool.fetch(accounts.tradePool),
        program.provider.connection.getMultipleAccountsInfo([accounts.base, accounts.quote]),
    ]);

    let poolInfo: ApiV3PoolInfoStandardItem | undefined;
    let poolKeys: AmmV4Keys | undefined;
    let rpcData: AmmRpcData;

    const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId: accounts.amm.toBase58() });
    poolInfo = data.poolInfo;
    poolKeys = data.poolKeys;
    rpcData = data.poolRpcData;

    const [baseReserve, quoteReserve, status] = [rpcData.baseReserve, rpcData.quoteReserve, rpcData.status];

    if (poolInfo.mintA.address !== accounts.quote.toBase58()
        && poolInfo.mintB.address !== accounts.quote.toBase58()
    ) {
        throw new Error("Quote mint does not match pool");
    }

    const mintIn = ((tradePoolInfo.isLongPool && args.positionAction === "open")
        || (!tradePoolInfo.isLongPool && args.positionAction === "close")
    ) ? accounts.quote : accounts.base;
    const mintOut = ((!tradePoolInfo.isLongPool && args.positionAction === "open")
        || (tradePoolInfo.isLongPool && args.positionAction === "close")
    ) ? accounts.base : accounts.quote;

    const out = raydium.liquidity.computeAmountOut({
        poolInfo: {
            ...poolInfo,
            baseReserve,
            quoteReserve,
            status: status.toNumber(),
            version: 4,
        },
        amountIn: new BN(args.amount),
        mintIn,
        mintOut,
        slippage: args.slippage,
    });

    // NOTE: The swap is always performed using the `currencyVault` and `collateralVault`
    // NOTE: But the user is delegated to be able to swap on behalf of the vaults
    const quoteAta = getAssociatedTokenAddressSync(
        accounts.quote,
        accounts.tradePool,
        true,
        quoteMintInfo.owner
    );
    const baseAta = getAssociatedTokenAddressSync(
        accounts.base,
        accounts.tradePool,
        true,
        baseMintInfo.owner
    );

    const tokenAccountIn = ((tradePoolInfo.isLongPool && args.positionAction === "open")
        || (!tradePoolInfo.isLongPool && args.positionAction === "close")
    ) ? quoteAta : baseAta;
    const tokenAccountOut = ((!tradePoolInfo.isLongPool && args.positionAction === "open")
        || (tradePoolInfo.isLongPool && args.positionAction === "close")
    ) ? baseAta : quoteAta;

    const instructionParams: SwapInstructionParams = {
        version: 4,
        poolKeys,
        userKeys: {
            tokenAccountIn,
            tokenAccountOut,
            owner: program.provider.publicKey,
        },
        amountIn: new BN(args.amount),
        amountOut: out.amountOut,
        fixedSide: args.side,
    };

    return makeAMMSwapInstruction(instructionParams);
}
