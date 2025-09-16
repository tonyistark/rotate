const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'src', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for different platforms
const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 24, name: 'icon-24x24.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 64, name: 'icon-64x64.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 1024, name: 'icon-1024x1024.png' }
];

async function generateIcons() {
  const svgPath = path.join(__dirname, 'src', 'assets', 'icon.svg');
  
  console.log('🎨 Generating app icons...');
  
  try {
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(iconsDir, name);
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }
    
    // Create a main icon.png (512x512) in the root assets folder
    const mainIconPath = path.join(__dirname, 'src', 'assets', 'icon.png');
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(mainIconPath);
    
    console.log('✅ Generated main icon.png (512x512)');
    
    // Create favicon.ico (multiple sizes embedded)
    const faviconPath = path.join(__dirname, 'src', 'favicon.ico');
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    console.log('✅ Generated favicon.png (32x32)');
    
    console.log('🎉 All icons generated successfully!');
    console.log(`📁 Icons saved to: ${iconsDir}`);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons();
