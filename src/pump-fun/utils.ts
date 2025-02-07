import { utils } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { SEED_PREFIX } from '../utils';

export const PUMP_FUN_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
export const PUMP_FUN_GLOBAL_ACCOUNT = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");

export const getBondingCurve = (mint: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [
            utils.bytes.utf8.encode('bonding-curve'),
            mint.toBuffer()
        ],
        PUMP_FUN_PROGRAM_ID,
    )[0];
};

export const getEventAuthority = () => {
    return PublicKey.findProgramAddressSync(
        [utils.bytes.utf8.encode(SEED_PREFIX.EVENT_AUTHORITY)],
        PUMP_FUN_PROGRAM_ID,
    )[0];
};

