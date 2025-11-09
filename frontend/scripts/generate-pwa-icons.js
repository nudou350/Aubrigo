const sharp = require('sharp');
const path = require('path');

const tealColor = { r: 76, g: 168, b: 160 }; // #4ca8a0
const inputPath = path.join(__dirname, '../src/assets/icon_nav.png');
const outputDir = path.join(__dirname, '../src/assets/icons');

const icons = [
  { name: 'apple-icon-180.png', size: 180, maskable: false },
  { name: 'icon-192x192.png', size: 192, maskable: false },
  { name: 'icon-512x512.png', size: 512, maskable: false },
  { name: 'manifest-icon-192.maskable.png', size: 192, maskable: true },
  { name: 'manifest-icon-512.maskable.png', size: 512, maskable: true }
];

async function generateIcon(iconConfig) {
  const { name, size, maskable } = iconConfig;
  const outputPath = path.join(outputDir, name);

  try {
    if (maskable) {
      // For maskable icons, add safe zone padding (20% on each side)
      // The icon content should be in the center 80% of the canvas
      const iconSize = Math.round(size * 0.6); // Icon is 60% of canvas (allows 20% padding)
      const padding = Math.round((size - iconSize) / 2);

      // Create solid teal background
      const background = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: tealColor
        }
      })
        .png()
        .toBuffer();

      // Resize icon and composite centered
      const resizedIcon = await sharp(inputPath)
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Composite icon on teal background
      await sharp(background)
        .composite([
          {
            input: resizedIcon,
            top: padding,
            left: padding
          }
        ])
        .png()
        .toFile(outputPath);
    } else {
      // For standard icons, resize to fill the entire canvas
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: tealColor
        })
        .png()
        .toFile(outputPath);
    }

    console.log(`✅ Generated: ${name} (${size}x${size}${maskable ? ' maskable' : ''})`);
  } catch (error) {
    console.error(`❌ Error generating ${name}:`, error);
    throw error;
  }
}

async function generateAllIcons() {
  console.log('🎨 Generating PWA icons from icon_nav.png...\n');

  try {
    for (const iconConfig of icons) {
      await generateIcon(iconConfig);
    }
    console.log('\n✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('\n❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateAllIcons();
