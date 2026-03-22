import fs from 'fs';

const filePath = './src/components/ManagerContent.jsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    /\{geminiKey \? `Active Spiritual Conduits \(\$\{geminiKey\.split\(\',\/\)\.filter\(k=>k\.trim\(\)\)\.length\}\/3\)` : \'Connection Severed\'\}/g,
    `{geminiKey === 'PROXY_MODE' ? '🟢 GHOST PROXY CONNECTED' : geminiKey ? \`Active Spiritual Conduits (\${geminiKey.split(',').filter(k=>k.trim()).length}/3)\` : 'Connection Severed'}`
);

content = content.replace(
    /\{geminiKey \? \'複数の霊的回路が同期しています。並列処理により制限を超越します。\' : \'対話を開始するにはAPIキーを接続してください。3つの鍵が推奨されます。\'\}/g,
    `{geminiKey === 'PROXY_MODE' ? '共用の無料プロキシ回路にて稼働中です。あなたのAPIキーは必要ありません。' : geminiKey ? '霊的回路が同期しています。' : '対話を開始するにはAPIキーを接続してください。'}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Manager Content Patched');
