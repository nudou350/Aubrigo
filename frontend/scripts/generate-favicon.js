const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  const size = 32;
  const tealColor = { r: 76, g: 168, b: 160 }; // #4ca8a0

  const inputPath = path.join(__dirname, '../src/assets/icon.PNG');
  const outputPath = path.join(__dirname, '../src/favicon.ico');

  try {
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

    // Resize the icon and composite it over the solid background
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: tealColor
      })
      .composite([
        {
          input: background,
          blend: 'dest-over'
        }
      ])
      .png()
      .toFile(outputPath);

    console.log('✅ Favicon generated successfully at:', outputPath);
    console.log('   Source:', inputPath);
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
