import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { illustrations } from '../lib/birthdayhub/illustrations';

async function main() {
  const outDir = path.join(process.cwd(), 'public', 'birthday', 'illustrations');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < illustrations.length; i++) {
    const buffer = await sharp(Buffer.from(illustrations[i]))
      .resize(600, 240)
      .png()
      .toBuffer();

    const outPath = path.join(outDir, `bday-${i + 1}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`Generated bday-${i + 1}.png`);
  }
  console.log(`\nAll ${illustrations.length} illustrations generated`);
}

main().catch(console.error);
