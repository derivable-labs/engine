"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateKeySigner = exports.MnemonicSigner = void 0;
const ethereum_crypto_1 = require("@zoltu/ethereum-crypto");
class MnemonicSigner {
    constructor(privateKey, publicKey, address) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.address = address;
        this.sign = async (message) => {
            const signature = await ethereum_crypto_1.ethereum.signRaw(this.privateKey, message);
            return {
                r: signature.r,
                s: signature.s,
                yParity: signature.recoveryParameter === 0 ? 'even' : 'odd',
            };
        };
    }
}
exports.MnemonicSigner = MnemonicSigner;
_a = MnemonicSigner;
MnemonicSigner.create = async (words) => {
    const seed = await ethereum_crypto_1.mnemonic.toSeed(words);
    const privateKey = await ethereum_crypto_1.hdWallet.privateKeyFromSeed(seed);
    const publicKey = await ethereum_crypto_1.secp256k1.privateKeyToPublicKey(privateKey);
    const address = await ethereum_crypto_1.ethereum.publicKeyToAddress(publicKey);
    return new MnemonicSigner(privateKey, publicKey, address);
};
class PrivateKeySigner {
    constructor(privateKey, publicKey, address) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.address = address;
        this.sign = async (message) => {
            const signature = await ethereum_crypto_1.ethereum.signRaw(this.privateKey, message);
            return {
                r: signature.r,
                s: signature.s,
                yParity: signature.recoveryParameter === 0 ? 'even' : 'odd',
            };
        };
    }
}
exports.PrivateKeySigner = PrivateKeySigner;
_b = PrivateKeySigner;
PrivateKeySigner.create = async (privateKey) => {
    const publicKey = await ethereum_crypto_1.secp256k1.privateKeyToPublicKey(privateKey);
    const address = await ethereum_crypto_1.ethereum.publicKeyToAddress(publicKey);
    return new PrivateKeySigner(privateKey, publicKey, address);
};
//# sourceMappingURL=signers.js.map