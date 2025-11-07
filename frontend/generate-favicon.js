const sharp = require('sharp');
const path = require('path');

const inputFile = path.join(__dirname, 'src/assets/icon.PNG');
const outputFile = path.join(__dirname, 'src/favicon.ico');

async function generateFavicon() {
  console.log('🚀 Gerando favicon a partir de icon.PNG...\n');

  try {
    // Generate favicon sizes (16x16 and 32x32)
    await sharp(inputFile)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, 'src/favicon.png'));

    console.log('✓ Gerado: favicon.png (32x32)');

    await sharp(inputFile)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(__dirname, 'src/favicon-16x16.png'));

    console.log('✓ Gerado: favicon-16x16.png (16x16)');
    console.log('\n✅ Favicons gerados com sucesso!');
    console.log('Nota: Renomeie favicon.png para favicon.ico ou use favicon.png no HTML');
  } catch (error) {
    console.error('✗ Erro ao gerar favicon:', error.message);
  }
}

generateFavicon().catch(console.error);
