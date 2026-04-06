import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const ENVS = {
  'DRY_RUN':          'true',
  'TRADE_AMOUNT_JPY': '1000',
  'BUY_THRESHOLD':    '1.5',
  'SELL_THRESHOLD':   '2.0',
  'TRADE_SECRET':     crypto.randomUUID().replace(/-/g,'').slice(0,16)
};

// 値があるものを環境から追加
const dynamicKeys = ['WALLET_API_KEY','WALLET_API_SECRET','DISCORD_WEBHOOK_URL','GITHUB_PAT_GIST','GIST_ID'];
for (const k of dynamicKeys) {
  if (process.env[k]) ENVS[k] = process.env[k];
}

for (const [key, value] of Object.entries(ENVS)) {
  console.log(`\n🔑 Setting ${key}...`);
  const tmpFile = path.join(process.cwd(), `.vercel_env_tmp_${key}`);
  writeFileSync(tmpFile, value + '\n', 'utf8');
  for (const envType of ['production']) {
    try { execSync(`vercel env rm ${key} ${envType} -y`, { stdio: 'ignore' }); } catch {}
    try {
      execSync(`vercel env add ${key} ${envType} < "${tmpFile}"`, { shell: true, stdio: 'inherit' });
      console.log(`  ✅ ${envType}`);
    } catch(e) {
      console.log(`  ❌ ${envType}: ${e.message.slice(0,100)}`);
    }
  }
  try { unlinkSync(tmpFile); } catch {}
}

console.log('\n🎉 完了！');
