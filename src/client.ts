import {
    AnchorProvider,
    Program,
    Wallet,
} from "@coral-xyz/anchor";
import {
    Transaction,
    VersionedTransaction,
    Connection,
} from "@solana/web3.js";
import { WasabiSolana } from "../idl/wasabi_solana";
import * as IDL from "../idl/wasabi_solana.json";

const idl: WasabiSolana = IDL as WasabiSolana;

export class WasabiClient {
    protected program: Program<WasabiSolana>;
    private wallet: Wallet;

    constructor(connection: Connection, wallet: Wallet) {
        const provider = new AnchorProvider(
            connection,
            wallet,
            {
                preflightCommitment: "confirmed",
                commitment: "confirmed",
            }
        );
        this.program = new Program(idl, provider);
        this.wallet = wallet;
    }

    //TODO: Send instructions
}

