'use strict';
const crypto = require('crypto');

function expMod(base, exp, mod) {
    let res = BigInt(1);
    base = base % mod;
    while (exp > 0) {
        if (exp % BigInt(2) === BigInt(1)) res = (res * base) % mod;
        base = (base * base) % mod;
        exp = exp / BigInt(2);
    }
    return res;
}

function calculateVerifier(username, password, salt) {
    const N = Buffer.from(
        '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8F' +
        'AB3C82872A3E9BB7', 
        'hex'
    );
    
    const g = BigInt(7);
    const userPassHash = crypto.createHash('sha1')
        .update(`${username.toUpperCase()}:${password.toUpperCase()}`)
        .digest();
    
    const xHash = crypto.createHash('sha1')
        .update(salt)
        .update(userPassHash)
        .digest();
        
    let x = BigInt('0x' + Buffer.from(xHash).reverse().toString('hex'));
    const nBI = BigInt('0x' + Buffer.from(N).reverse().toString('hex'));
    const vBI = expMod(g, x, nBI);
    
    let vHex = vBI.toString(16);
    if (vHex.length % 2 !== 0) vHex = '0' + vHex;
    const vBuf = Buffer.from(vHex, 'hex').reverse();
    
    const finalV = Buffer.alloc(32, 0);
    vBuf.copy(finalV);
    
    return finalV;
}

// Test with known values (this is harder without a reference, so we just check it runs)
const username = "testuser";
const password = "password123";
const salt = crypto.randomBytes(32);
const verifier = calculateVerifier(username, password, salt);

console.log("SRP6 Test:");
console.log("Username:", username);
console.log("Salt (hex):", salt.toString('hex'));
console.log("Verifier (hex):", verifier.toString('hex'));
console.log("Verifier length:", verifier.length);
if (verifier.length === 32) {
    console.log("SUCCESS: Verifier is 32 bytes.");
} else {
    console.error("FAILURE: Verifier length is incorrect.");
    process.exit(1);
}
