const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, '..', 'public', 'satorii.png');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const iconSizes = [
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 },
];

const foregroundSizes = [
    { folder: 'mipmap-mdpi', size: 108 },
    { folder: 'mipmap-hdpi', size: 162 },
    { folder: 'mipmap-xhdpi', size: 216 },
    { folder: 'mipmap-xxhdpi', size: 324 },
    { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function generateIcons() {
    console.log('Generating Android icons from satorii.png...');

    for (const { folder, size } of iconSizes) {
        const outputDir = path.join(androidResDir, folder);

        // ic_launcher.png
        await sharp(sourceIcon)
            .resize(size, size)
            .png()
            .toFile(path.join(outputDir, 'ic_launcher.png'));

        // ic_launcher_round.png (same for now, but could be circular)
        await sharp(sourceIcon)
            .resize(size, size)
            .png()
            .toFile(path.join(outputDir, 'ic_launcher_round.png'));

        console.log(`  Created ${folder}/ic_launcher.png (${size}x${size})`);
    }

    // Generate foreground icons (larger with padding for adaptive icons)
    for (const { folder, size } of foregroundSizes) {
        const outputDir = path.join(androidResDir, folder);

        await sharp(sourceIcon)
            .resize(Math.round(size * 0.6), Math.round(size * 0.6)) // Icon takes ~60% of foreground
            .extend({
                top: Math.round(size * 0.2),
                bottom: Math.round(size * 0.2),
                left: Math.round(size * 0.2),
                right: Math.round(size * 0.2),
                background: { r: 17, g: 20, b: 16, alpha: 1 } // Dark background matching app
            })
            .resize(size, size)
            .png()
            .toFile(path.join(outputDir, 'ic_launcher_foreground.png'));

        console.log(`  Created ${folder}/ic_launcher_foreground.png (${size}x${size})`);
    }

    console.log('Done! Android icons generated.');
}

generateIcons().catch(console.error);
