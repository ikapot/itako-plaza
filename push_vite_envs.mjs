import { execSync } from 'child_process';

const envs = {
    'VITE_PROXY_URL': '/api/streamChat',
    'VITE_GEMINI_API_KEY': 'PROXY_MODE'
};

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
console.log("Finished pushing frontend envs to Vercel!");
