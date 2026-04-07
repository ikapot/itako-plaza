import sharp from 'sharp';
import { readdir, stat, rename, unlink } from 'fs/promises';
import { join, extname, basename } from 'path';

const assetsDir = './public/assets';
const files = await readdir(assetsDir);

// まずtmpファイルを削除
for (const file of files) {
  if (file.endsWith('.tmp')) {
    await unlink(join(assetsDir, file));
    console.log(`Removed tmp: ${file}`);
  }
}

// PNGをWebPに変換（小さく）
const refreshed = await readdir(assetsDir);
for (const file of refreshed) {
  const ext = extname(file).toLowerCase();
  if (ext !== '.png') continue;
  
  const inputPath = join(assetsDir, file);
  const inputStat = await stat(inputPath);
  const beforeKB = Math.round(inputStat.size / 1024);
  
  // WebPで出力
  const webpName = file.replace('.png', '.webp');
  const webpPath = join(assetsDir, webpName);
  
  try {
    await sharp(inputPath)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(webpPath);
    
    const webpStat = await stat(webpPath);
    const afterKB = Math.round(webpStat.size / 1024);
    const reduction = Math.round((1 - afterKB/beforeKB) * 100);
    console.log(`${file}: ${beforeKB}KB → ${webpName}: ${afterKB}KB (-${reduction}%)`);
  } catch (e) {
    console.error(`Failed: ${file}`, e.message);
  }
}
console.log('Done!');
