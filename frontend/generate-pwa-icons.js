const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'src/assets/paw_register.webp');
const outputDir = path.join(__dirname, 'src/assets/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const iconSizes = [
  { name: 'manifest-icon-192.maskable.png', size: 192 },
  { name: 'manifest-icon-512.maskable.png', size: 512 },
  { name: 'apple-icon-180.png', size: 180 }
];

async function generateIcons() {
  console.log('Gerando ícones PWA a partir de paw_register.webp com rotação de 45°...\n');

  for (const icon of iconSizes) {
    try {
      const outputPath = path.join(outputDir, icon.name);

      // Create icon with rotation and background
      await sharp(inputFile)
        .rotate(45, { background: { r: 76, g: 168, b: 160, alpha: 1 } })
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 76, g: 168, b: 160, alpha: 1 } // #4ca8a0
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Gerado: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Erro ao gerar ${icon.name}:`, error.message);
    }
  }

  console.log('\n✓ Ícones PWA gerados com sucesso!');
}

generateIcons().catch(console.error);
