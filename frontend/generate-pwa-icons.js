const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'src/assets/icon.PNG');
const outputDir = path.join(__dirname, 'src/assets/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const iconSizes = [
  { name: 'manifest-icon-192.maskable.png', size: 192, maskable: true },
  { name: 'manifest-icon-512.maskable.png', size: 512, maskable: true },
  { name: 'apple-icon-180.png', size: 180, maskable: false },
  { name: 'icon-192x192.png', size: 192, maskable: false },
  { name: 'icon-512x512.png', size: 512, maskable: false }
];

async function generateIcons() {
  console.log('🚀 Gerando ícones PWA a partir de icon.PNG...\n');

  for (const icon of iconSizes) {
    try {
      const outputPath = path.join(outputDir, icon.name);

      // For maskable icons, add padding with teal background
      if (icon.maskable) {
        const maskablePadding = 0.1; // 10% padding = 80% safe zone
        const safeSize = Math.floor(icon.size * (1 - maskablePadding * 2));

        await sharp(inputFile)
          .resize(safeSize, safeSize, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .extend({
            top: Math.floor(icon.size * maskablePadding),
            bottom: Math.floor(icon.size * maskablePadding),
            left: Math.floor(icon.size * maskablePadding),
            right: Math.floor(icon.size * maskablePadding),
            background: { r: 76, g: 168, b: 160, alpha: 1 } // Teal background
          })
          .png()
          .toFile(outputPath);
      } else {
        // Standard icons without background
        await sharp(inputFile)
          .resize(icon.size, icon.size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
      }

      console.log(`✓ Gerado: ${icon.name} (${icon.size}x${icon.size})${icon.maskable ? ' [maskable]' : ''}`);
    } catch (error) {
      console.error(`✗ Erro ao gerar ${icon.name}:`, error.message);
    }
  }

  console.log('\n✅ Todos os ícones PWA foram gerados com sucesso!');
}

generateIcons().catch(console.error);
