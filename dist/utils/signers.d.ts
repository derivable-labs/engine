import { secp256k1 } from '@zoltu/ethereum-crypto';
import { Bytes } from '@zoltu/ethereum-types';
export declare class MnemonicSigner {
    private readonly privateKey;
    readonly publicKey: secp256k1.AffinePoint & secp256k1.JacobianPoint;
    readonly address: bigint;
    private constructor();
    static readonly create: (words: string[]) => Promise<MnemonicSigner>;
    sign: (message: Bytes) => Promise<{
        r: bigint;
        s: bigint;
        yParity: 'even' | 'odd';
    }>;
}
export declare class PrivateKeySigner {
    private readonly privateKey;
    readonly publicKey: secp256k1.AffinePoint & secp256k1.JacobianPoint;
    readonly address: bigint;
    private constructor();
    static readonly create: (privateKey: bigint) => Promise<PrivateKeySigner>;
    sign: (message: Bytes) => Promise<{
        r: bigint;
        s: bigint;
        yParity: 'even' | 'odd';
    }>;
}
