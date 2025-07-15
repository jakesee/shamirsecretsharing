// sss2.js - ES6+ refactor of sss.js as ShamirSecretsSharing class
// No ES6 exports. All logic in one file. No encoding.js or cryptography.js dependencies.
// Expose class on window for global access.

class ShamirSecretsSharing {
    /**
     * Converts a given UTF16 character string to the HEX representation.
     * Each character of the input string is represented by `bytesPerChar` bytes in the output string.
     * @param {string} str - Input string to convert.
     * @param {number} [bytesPerChar=2] - Number of bytes per character (default 2).
     * @returns {string} Hexadecimal string representation of input.
     * @throws {Error} If input is not a string or bytesPerChar is invalid.
     */
    /**
     * Converts a given UTF16 character string to the HEX representation.
     * Each character of the input string is represented by `bytesPerChar` bytes in the output string.
     * @param {string} str - Input string to convert.
     * @param {number} [bytesPerChar=2] - Number of bytes per character (default 2).
     * @returns {string} Hexadecimal string representation of input.
     * @throws {Error} If input is not a string or bytesPerChar is invalid.
     */
    str2hex(str, bytesPerChar = 2) {
        if (typeof str !== 'string') {
            throw new Error('Input must be a character string.');
        }
        if (typeof bytesPerChar !== 'number' || bytesPerChar % 1 !== 0 || bytesPerChar < 1 || bytesPerChar > 6) {
            throw new Error('Bytes per character must be an integer between 1 and 6, inclusive.');
        }
        const hexChars = 2 * bytesPerChar;
        const max = Math.pow(16, hexChars) - 1;
        let out = '';
        for (let i = 0; i < str.length; i++) {
            const num = str.charCodeAt(i);
            if (isNaN(num)) {
                throw new Error('Invalid character: ' + str[i]);
            } else if (num > max) {
                const neededBytes = Math.ceil(Math.log(num + 1) / Math.log(256));
                throw new Error('Invalid character code (' + num + '). Maximum allowable is 256^bytes-1 (' + max + '). To convert this character, use at least ' + neededBytes + ' bytes.');
            } else {
                out = num.toString(16).padStart(hexChars, '0') + out;
            }
        }
        return out;
    }
    /**
     * Combine parts and return result or error message
     * @param {string[]} parts - Array of share strings
     * @returns {{success: boolean, result: string}} - Combined secret or error message
     */
    combineParts(parts) {
        try {
            const combined = this.combine(parts);
            return { success: true, result: combined };
        } catch (e) {
            return { success: false, result: e.message };
        }
    }
    // Helper: hex to string (UTF-16, 2 bytes per char)
    /**
     * Converts a given HEX number string to a UTF16 character string.
     * Each character of the input string is represented by `bytesPerChar` bytes in the output string.
     * Output is built in reverse order for compatibility with legacy SSS implementations.
     * @param {string} hex - Hexadecimal string to convert.
     * @param {number} [bytesPerChar=2] - Number of bytes per character (default 2).
     * @returns {string} Decoded string.
     */
    hex2str(hex, bytesPerChar = 2) {
        let out = '';
        hex = this.padLeft(hex, bytesPerChar * 2);
        for (let i = 0; i < hex.length; i += bytesPerChar * 2) {
            out = String.fromCharCode(parseInt(hex.slice(i, i + bytesPerChar * 2), 16)) + out;
        }
        return out;
    }
    constructor(bits = 8) {
        this.defaults = {
            bits: 8,
            radix: 16,
            minBits: 3,
            maxBits: 20,
            bytesPerChar: 2,
            maxBytesPerChar: 6,
            primitivePolynomials: [null, null, 1, 3, 3, 5, 3, 3, 29, 17, 9, 5, 83, 27, 43, 3, 45, 9, 39, 39, 9, 5, 3, 33, 27, 9, 71, 39, 9, 5, 83],
            warning: 'WARNING:\nA secure random number generator was not found.\nUsing Math.random(), which is NOT cryptographically strong!'
        };
        this.config = {};
        this.init(bits);
    }

    init(bits) {
        if (bits && (typeof bits !== 'number' || bits % 1 !== 0 || bits < this.defaults.minBits || bits > this.defaults.maxBits)) {
            throw new Error(`Number of bits must be an integer between ${this.defaults.minBits} and ${this.defaults.maxBits}, inclusive.`);
        }
        this.config.radix = this.defaults.radix;
        this.config.bits = bits || this.defaults.bits;
        this.config.size = Math.pow(2, this.config.bits);
        this.config.max = this.config.size - 1;
        // Construct exp and log tables for multiplication
        const logs = [], exps = [];
        let x = 1, primitive = this.defaults.primitivePolynomials[this.config.bits];
        for (let i = 0; i < this.config.size; i++) {
            exps[i] = x;
            logs[x] = i;
            x <<= 1;
            if (x >= this.config.size) {
                x ^= primitive;
                x &= this.config.max;
            }
        }
        this.config.logs = logs;
        this.config.exps = exps;
    }

    getConfig() {
        return {
            bits: this.config.bits,
            unsafePRNG: this.config.unsafePRNG
        };
    }

    setRNG(rng, alert) {
        if (!this.isInited()) {
            this.init();
        }
        this.config.unsafePRNG = false;
        rng = rng || this.getRNG();
        // test the RNG (5 times)
        if (typeof rng !== 'function' || typeof rng(this.config.bits) !== 'string' || !parseInt(rng(this.config.bits), 2) || rng(this.config.bits).length > this.config.bits || rng(this.config.bits).length < this.config.bits) {
            throw new Error("Random number generator is invalid. Supply an RNG of the form function(bits){} that returns a string containing 'bits' number of random 1's and 0's.")
        } else {
            this.config.rng = rng;
        }
        this.config.alert = !!alert;
        return !!this.config.unsafePRNG;
    }

    isInited() {
        const c = this.config;
        return c.bits && c.size && c.max && c.logs && c.exps && c.logs.length === c.size && c.exps.length === c.size;
    }

    isSetRNG() {
        return typeof this.config.rng === 'function';
    }

    getRNG() {
        // Only use Math.random for now
        this.config.unsafePRNG = true;
        const bitsPerNum = 32;
        const max = Math.pow(2, bitsPerNum) - 1;
        return (bits) => {
            const elems = Math.ceil(bits / bitsPerNum);
            let arr = [], str = '';
            for (let i = 0; i < elems; i++) {
                arr[i] = Math.floor(Math.random() * max + 1);
            }
            for (let i = 0; i < arr.length; i++) {
                str += arr[i].toString(2).padStart(bitsPerNum, '0');
            }
            str = str.substr(-bits);
            if ((str.match(/0/g) || []).length === str.length) {
                return this.getRNG()(bits); // retry if all zeros
            } else {
                return str;
            }
        };
    }

    random(bits) {
        if (!this.isSetRNG()) {
            this.setRNG();
        }
        if (typeof bits !== 'number' || bits % 1 !== 0 || bits < 2) {
            throw new Error('Number of bits must be an integer greater than 1.');
        }
        if (this.config.unsafePRNG) {
            // Optionally warn
        }
        return this.bin2hex(this.config.rng(bits));
    }

    // Helper: pad left
    padLeft(str, bits) {
        bits = bits || this.config.bits;
        const missing = str.length % bits;
        return (missing ? '0'.repeat(bits - missing) : '') + str;
    }

    // Helper: hex to bin
    hex2bin(str) {
        let bin = '';
        for (let i = str.length - 1; i >= 0; i--) {
            const num = parseInt(str[i], 16);
            if (isNaN(num)) throw new Error('Invalid hex character.');
            bin = this.padLeft(num.toString(2), 4) + bin;
        }
        return bin;
    }

    // Helper: bin to hex
    bin2hex(str) {
        let hex = '';
        str = this.padLeft(str, 4);
        for (let i = str.length; i >= 4; i -= 4) {
            const num = parseInt(str.slice(i - 4, i), 2);
            if (isNaN(num)) throw new Error('Invalid binary character.');
            hex = num.toString(16) + hex;
        }
        return hex;
    }

    // Split a binary string into bits-length segments (right-to-left)
    split(str, padLength) {
        if (padLength) {
            str = this.padLeft(str, padLength);
        }
        const parts = [];
        for (let i = str.length; i > this.config.bits; i -= this.config.bits) {
            parts.push(parseInt(str.slice(i - this.config.bits, i), 2));
        }
        parts.push(parseInt(str.slice(0, str.length % this.config.bits || this.config.bits), 2));
        return parts;
    }

    // Share a secret
    share(secret, numShares, threshold, padLength = 0, withoutPrefix = false) {
        if (!this.isInited()) this.init();
        if (!this.isSetRNG()) this.setRNG();
        if (typeof secret !== 'string') throw new Error('Secret must be a string.');
        if (typeof numShares !== 'number' || numShares % 1 !== 0 || numShares < 2) throw new Error(`Number of shares must be an integer between 2 and ${this.config.max}, inclusive.`);
        if (numShares > this.config.max) throw new Error(`Number of shares must be an integer between 2 and ${this.config.max}, inclusive.`);
        if (typeof threshold !== 'number' || threshold % 1 !== 0 || threshold < 2) throw new Error(`Threshold must be an integer between 2 and ${this.config.max}, inclusive.`);
        if (threshold > this.config.max) throw new Error(`Threshold must be an integer between 2 and ${this.config.max}, inclusive.`);
        if (typeof padLength !== 'number' || padLength % 1 !== 0) throw new Error('Zero-pad length must be an integer greater than 1.');
        secret = '1' + this.hex2bin(secret);
        const splitArr = this.split(secret, padLength);
        let x = new Array(numShares), y = new Array(numShares);
        for (let i = 0; i < splitArr.length; i++) {
            const subShares = this._getShares(splitArr[i], numShares, threshold);
            for (let j = 0; j < numShares; j++) {
                x[j] = x[j] || subShares[j].x.toString(this.config.radix);
                y[j] = this.padLeft(subShares[j].y.toString(2)) + (y[j] ? y[j] : '');
            }
        }
        const padding = this.config.max.toString(this.config.radix).length;
        if (withoutPrefix) {
            for (let i = 0; i < numShares; i++) {
                x[i] = this.bin2hex(y[i]);
            }
        } else {
            for (let i = 0; i < numShares; i++) {
                x[i] = this.config.bits.toString(36).toUpperCase() + this.padLeft(x[i], padding) + this.bin2hex(y[i]);
            }
        }
        return x;
    }

    // Get shares for a segment
    _getShares(secret, numShares, threshold) {
        const shares = [];
        const coeffs = [secret];
        for (let i = 1; i < threshold; i++) {
            coeffs[i] = parseInt(this.config.rng(this.config.bits), 2);
        }
        for (let i = 1; i < numShares + 1; i++) {
            shares[i - 1] = {
                x: i,
                y: this.horner(i, coeffs)
            };
        }
        return shares;
    }

    // Horner's method for polynomial evaluation
    horner(x, coeffs) {
        const logx = this.config.logs[x];
        let fx = 0;
        for (let i = coeffs.length - 1; i >= 0; i--) {
            if (fx === 0) {
                fx = coeffs[i];
                continue;
            }
            fx = this.config.exps[(logx + this.config.logs[fx]) % this.config.max] ^ coeffs[i];
        }
        return fx;
    }

    // Process a share string
    processShare(share) {
        const bits = parseInt(share[0], 36);
        if (bits && (typeof bits !== 'number' || bits % 1 !== 0 || bits < this.defaults.minBits || bits > this.defaults.maxBits)) {
            throw new Error(`Number of bits must be an integer between ${this.defaults.minBits} and ${this.defaults.maxBits}, inclusive.`);
        }
        const max = Math.pow(2, bits) - 1;
        const idLength = max.toString(this.config.radix).length;
        const id = parseInt(share.substr(1, idLength), this.config.radix);
        if (typeof id !== 'number' || id % 1 !== 0 || id < 1 || id > max) {
            throw new Error(`Share id must be an integer between 1 and ${this.config.max}, inclusive.`);
        }
        const value = share.substr(idLength + 1);
        if (!value.length) throw new Error('Invalid share: zero-length share.');
        return { bits, id, value };
    }

    // Lagrange interpolation
    lagrange(at, xArr, yArr) {
        let sum = 0;
        for (let i = 0; i < xArr.length; i++) {
            if (!yArr[i]) continue;
            let product = this.config.logs[yArr[i]];
            for (let j = 0; j < xArr.length; j++) {
                if (i === j) continue;
                if (at === xArr[j]) {
                    product = -1;
                    break;
                }
                product = (product + this.config.logs[at ^ xArr[j]] - this.config.logs[xArr[i] ^ xArr[j]] + this.config.max) % this.config.max;
            }
            sum = product === -1 ? sum : sum ^ this.config.exps[product];
        }
        return sum;
    }

    // Combine shares
    combine(shares) {
        let setBits;
        let x = [], y = [], result = '';
        for (let i = 0; i < shares.length; i++) {
            const share = this.processShare(shares[i]);
            if (setBits === undefined) {
                setBits = share.bits;
            } else if (share.bits !== setBits) {
                throw new Error('Mismatched shares: Different bit settings.');
            }
            if (this.config.bits !== setBits) {
                this.init(setBits);
            }
            if (x.includes(share.id)) continue;
            const idx = x.push(share.id) - 1;
            const split = this.split(this.hex2bin(share.value));
            for (let j = 0; j < split.length; j++) {
                if (!y[j]) y[j] = [];
                y[j][idx] = split[j];
            }
        }
        for (let i = 0; i < y.length; i++) {
            result = this.padLeft(this.lagrange(0, x, y[i]).toString(2)) + result;
        }
        const idx = result.indexOf('1');
        const hex = this.bin2hex(result.slice(idx + 1));
        return this.hex2str(hex);
    }
}

// Expose globally
window.secrets = new ShamirSecretsSharing();
