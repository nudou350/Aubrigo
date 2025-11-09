const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  const size = 32;
  const tealColor = '#4ca8a0';

  // Create SVG with solid teal background
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Solid teal background -->
      <rect width="${size}" height="${size}" fill="${tealColor}"/>

      <!-- Simple white paw print -->
      <circle cx="16" cy="18" r="5" fill="white"/>
      <circle cx="11" cy="12" r="3" fill="white"/>
      <circle cx="21" cy="12" r="3" fill="white"/>
      <circle cx="11" cy="20" r="2.5" fill="white"/>
      <circle cx="21" cy="20" r="2.5" fill="white"/>
    </svg>
  `;

  const outputPath = path.join(__dirname, '../src/favicon.ico');

  try {
    // Generate 32x32 PNG and save as ICO
    await sharp(Buffer.from(svg))
      .resize(32, 32)
      .png()
      .toFile(outputPath);

    console.log('✅ Favicon generated successfully at:', outputPath);
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
