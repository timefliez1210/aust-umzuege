'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Hero.module.css';

interface HeroData {
  imageUrl?: string;
  image: string; // Make image required
  imageAlt?: string;
  title?: string;
  name?: string;
  subtitle?: string;
  description?: string;
  ctaLink?: string;
  buttonLink?: string;
  ctaText?: string;
  buttonText?: string;
}

interface HeroProps {
  heroData: HeroData;
}

const Hero: React.FC<HeroProps> = ({ heroData }) => {
  return (
    <section className={styles.hero} role="banner">
      <Image
        src={heroData.image}
        alt={heroData.imageAlt || `${heroData.name || heroData.title} Hero Bild`}
        fill
        style={{ objectFit: 'cover' }}
        priority // Equivalent to loading="eager" and fetchpriority="high"
        sizes="100vw"
        quality={75}
        className={styles['hero-img']}
      />
      <div className={styles['hero-overlay']}>
        <div className={styles['hero-content']}>
          <h1>{heroData.title || heroData.name}</h1>
          <p>{heroData.subtitle || heroData.description}</p>
          {(heroData.ctaText || heroData.buttonText) && (
            <Link href={heroData.ctaLink || heroData.buttonLink || '#'}><button className="button" aria-label="Jetzt anfragen">
              {heroData.ctaText || heroData.buttonText}
            </button></Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
