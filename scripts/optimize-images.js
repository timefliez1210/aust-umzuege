import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const STATIC_DIR = './static';

// Images that need responsive versions for carousel (displayed at 352x264)
const carouselImages = [
  'montagen-demontagen-carousel-2.webp',
  'umzuege-hildesheim-carousel-1.webp',
  'privatumzuege-hildesheim-carousel-1.webp',
  'Haushaltsaufloesungen-Entruempelungen-carousel-3.webp',
  'einlagerung-service-hildesheim-carousel-4.webp',
  'seniorenumzuege-hildesheim-carousel-6.webp'
];

// About section image (displayed at ~500px width)
const aboutImage = 'umziehen-leicht-gemacht-hildesheim-hannover-braunschweig.webp';

// Hero image (LCP - needs optimization)
const heroImage = 'umzuege-haushaltsaufloesungen-hildesheim-umgebung.webp';

async function resizeImage(inputPath, outputPath, width, quality = 80) {
  try {
    await sharp(inputPath)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toFile(outputPath);
    console.log(`✓ Created ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to create ${outputPath}:`, error.message);
  }
}

async function optimizeCarouselImages() {
  console.log('\n📸 Optimizing carousel images...\n');

  const sizes = [
    { width: 400, suffix: '-400w' },   // Mobile
    { width: 600, suffix: '-600w' },   // Tablet
    { width: 800, suffix: '-800w' }    // Desktop (original kept as reference)
  ];

  for (const image of carouselImages) {
    const inputPath = join(STATIC_DIR, image);
    const baseName = image.replace('.webp', '');

    for (const { width, suffix } of sizes) {
      const outputPath = join(STATIC_DIR, `${baseName}${suffix}.webp`);
      await resizeImage(inputPath, outputPath, width, 80);
    }
  }
}

async function optimizeAboutImage() {
  console.log('\n🖼️  Optimizing about section image...\n');

  const sizes = [
    { width: 400, suffix: '-400w' },
    { width: 500, suffix: '-500w' },
    { width: 600, suffix: '-600w' }
  ];

  const inputPath = join(STATIC_DIR, aboutImage);
  const baseName = aboutImage.replace('.webp', '');

  for (const { width, suffix } of sizes) {
    const outputPath = join(STATIC_DIR, `${baseName}${suffix}.webp`);
    await resizeImage(inputPath, outputPath, width, 82);
  }
}

async function optimizeHeroImage() {
  console.log('\n🎭 Optimizing hero image (LCP)...\n');

  const sizes = [
    { width: 640, suffix: '-640w', quality: 75 },   // Mobile
    { width: 1024, suffix: '-1024w', quality: 78 },  // Tablet
    { width: 1536, suffix: '-1536w', quality: 80 },  // Desktop
    { width: 1920, suffix: '-1920w', quality: 82 }   // Large desktop
  ];

  const inputPath = join(STATIC_DIR, heroImage);
  const baseName = heroImage.replace('.webp', '');

  for (const { width, suffix, quality } of sizes) {
    const outputPath = join(STATIC_DIR, `${baseName}${suffix}.webp`);
    await resizeImage(inputPath, outputPath, width, quality);
  }
}

async function main() {
  console.log('🚀 Starting image optimization...');

  await optimizeCarouselImages();
  await optimizeAboutImage();
  await optimizeHeroImage();

  console.log('\n✅ Image optimization complete!\n');
}

main();
