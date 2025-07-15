/*
 * unittest.js - Basic unit tests for ShamirSecretsSharing
 * Author: Jake See
 * License: GPL v3
 */


window.runUnitTests = function runUnitTests() {
    const results = [];
    try {
        // Test 1: Split and reconstruct
        const sss = window.secrets;
        const secret = 'Hello, world!';
        const threshold = 3, numShares = 5;
        const secretHex = sss.str2hex(secret);
        const parts = sss.share(secretHex, numShares, threshold);
        results.push({
            title: 'Test 1: Split parts count',
            status: (parts.length === numShares ? 'PASS' : 'FAIL'),
            debug: [
                `Parts: ${parts.length}`,
                ...parts.map((part, idx) => `Part ${idx+1}: ${part}`)
            ]
        });

        // Test 2: Encode/decode part (skipped)
        results.push({
            title: 'Test 2: Encode/decode part',
            status: 'SKIPPED',
            debug: []
        });

        // Test 3: Reconstruct from threshold parts (combine)
        const selected = [parts[0], parts[2], parts[4]];
        const reconstructed = sss.combine(selected);
        results.push({
            title: 'Test 3: Reconstruct secret (threshold) - combine',
            status: (reconstructed === secret ? 'PASS' : 'FAIL'),
            debug: [
                `Selected parts: [${selected.join(', ')}]`,
                `Original: ${secret}`,
                `Reconstructed string: ${reconstructed}`
            ]
        });

        // Test 3b: Reconstruct from threshold parts (combineParts)
        const combinedPartsResult = sss.combineParts(selected);
        results.push({
            title: 'Test 3b: Reconstruct secret (threshold) - combineParts',
            status: (combinedPartsResult.success && combinedPartsResult.result === secret ? 'PASS' : 'FAIL'),
            debug: [
                `Selected parts: [${selected.join(', ')}]`,
                `Original: ${secret}`,
                `Result: ${combinedPartsResult.result}`,
                `Success: ${combinedPartsResult.success}`
            ]
        });

        // Test 4: Reconstruct with all parts (combine)
        const reconstructedAll = sss.combine(parts);
        results.push({
            title: 'Test 4: Reconstruct with all parts - combine',
            status: (reconstructedAll === secret ? 'PASS' : 'FAIL'),
            debug: [
                `All parts: [${parts.join(', ')}]`,
                `Original: ${secret}`,
                `Reconstructed string: ${reconstructedAll}`
            ]
        });

        // Test 4b: Reconstruct with all parts (combineParts)
        const combinedAllPartsResult = sss.combineParts(parts);
        results.push({
            title: 'Test 4b: Reconstruct with all parts - combineParts',
            status: (combinedAllPartsResult.success && combinedAllPartsResult.result === secret ? 'PASS' : 'FAIL'),
            debug: [
                `All parts: [${parts.join(', ')}]`,
                `Original: ${secret}`,
                `Result: ${combinedAllPartsResult.result}`,
                `Success: ${combinedAllPartsResult.success}`
            ]
        });

        // Encoding.js tests removed; sss2.js handles encoding internally
    } catch (err) {
        results.push({
            title: 'Error',
            status: 'FAIL',
            debug: [err.message, err.stack]
        });
        console.error('Unit Test Error:', err);
    }
    // Print only important results to console
    console.log('Unit Test Results:');
    results.forEach(r => {
        console.log(`${r.title}: ${r.status}`);
        if(r.status === 'FAIL' && r.debug) {
            r.debug.forEach(d => console.log('  ', d));
        }
    });
    return results;
}

