import { execSync } from 'child_process';
import fs from 'fs';

const content = fs.readFileSync('vercel_envs.txt', 'utf8');
const lines = content.split('\n');
const envs = {};
for (const line of lines) {
    if (line.startsWith('FIREBASE_PROJECT_ID=')) envs.FIREBASE_PROJECT_ID = line.substring('FIREBASE_PROJECT_ID='.length);
    if (line.startsWith('FIREBASE_CLIENT_EMAIL=')) envs.FIREBASE_CLIENT_EMAIL = line.substring('FIREBASE_CLIENT_EMAIL='.length);
    if (line.startsWith('FIREBASE_PRIVATE_KEY=')) envs.FIREBASE_PRIVATE_KEY = line.substring('FIREBASE_PRIVATE_KEY='.length).replace(/^"/, '').replace(/"$/, '');
}

for (const [key, value] of Object.entries(envs)) {
    console.log(`Setting ${key}...`);
    for (const envType of ['production', 'preview', 'development']) {
        try { 
            execSync(`npx vercel env rm ${key} ${envType} -y`, { stdio: 'ignore' }); 
        } catch(e) {}
        
        try {
            execSync(`npx vercel env add ${key} ${envType}`, {
                input: value,
                stdio: ['pipe', 'ignore', 'ignore']
            });
            console.log(`  - Set for ${envType}`);
        } catch (e) {
            console.error(`  - Failed for ${envType}`);
        }
    }
}
console.log("Finished pushing to Vercel!");
