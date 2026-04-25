import fs from 'fs';

async function run() {
    try {
        const b64 = fs.readFileSync('b64.txt', 'utf8');
        const decoded = Buffer.from(b64, 'base64').toString('utf8');
        console.log("Decoded length:", decoded.length);
        console.log("First 100 chars:", decoded.substring(0, 100));
        
        if (decoded.trim().startsWith('{') || decoded.trim().startsWith('[')) {
            const data = JSON.parse(decoded);
            console.log("Successfully parsed JSON from b64.txt");
            console.log("Matches:", data.matches?.length);
            console.log("Teams:", data.teams?.length);
        } else {
            console.log("Decoded content does not look like JSON.");
        }
    } catch (e) {
        console.error("Error decoding b64.txt:", e.message);
    }
}

run();
