const sharp = require('sharp');
const path = require('path');

const inputFile = path.join(__dirname, 'src/assets/paw_register.webp');
const outputFile = path.join(__dirname, 'src/favicon.ico');

async function generateFavicon() {
  console.log('Gerando favicon.ico a partir de paw_register.webp com rotação de 45°...\n');

  try {
    // Generate a 32x32 PNG first (ICO format needs PNG)
    const pngBuffer = await sharp(inputFile)
      .rotate(45, { background: { r: 76, g: 168, b: 160, alpha: 1 } })
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 76, g: 168, b: 160, alpha: 1 } // #4ca8a0
      })
      .png()
      .toBuffer();

    // Save as PNG (browsers support PNG as favicon)
    await sharp(pngBuffer)
      .toFile(outputFile.replace('.ico', '.png'));

    console.log('✓ Gerado: favicon.png (32x32)');
    console.log('\nNota: Renomeie favicon.png para favicon.ico ou use favicon.png no HTML');
  } catch (error) {
    console.error('✗ Erro ao gerar favicon:', error.message);
  }
}

generateFavicon().catch(console.error);
