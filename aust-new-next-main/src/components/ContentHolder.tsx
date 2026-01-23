'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './ContentHolder.module.css';

interface ContentHolderProps {
  imageUrl?: string;
  altText?: string;
  heading: string;
  text: string;
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
  centerButton?: boolean;
  isLink?: boolean;
}

const ContentHolder: React.FC<ContentHolderProps> = ({
  imageUrl,
  altText,
  heading,
  text,
  showButton = false,
  buttonText = "Mehr erfahren",
  buttonLink = "#",
  centerButton = false,
  isLink = true,
}) => {
  const formatText = (inputText: string) => {
    // Replace ### with <h3>
    let formattedText = inputText.replace(/### (.*)/g, '<h3>$1</h3>');

    // Replace **text** with <strong>text</strong>
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const lines = formattedText.split('\n');
    let htmlContent = '';
    let inList = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('<h3>')) {
        htmlContent += trimmedLine;
      } else if (trimmedLine.startsWith('•')) {
        if (!inList) {
          htmlContent += '<ul>';
          inList = true;
        }
        htmlContent += `<li>${trimmedLine.substring(1).trim()}</li>`;
      } else {
        if (inList) {
          htmlContent += '</ul>';
          inList = false;
        }
        if (trimmedLine) {
          htmlContent += `<p>${trimmedLine}</p>`;
        }
      }
    });

    if (inList) {
      htmlContent += '</ul>';
    }
    return htmlContent;
  };

  return (
    <div className={styles['content-holder']}>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={altText || heading}
          width={600}
          height={400}
          loading="lazy"
          className={styles['content-image']}
        />
      )}
      <div className={styles.content}>
        <h2>{heading}</h2>
        <div
          className={styles['content-text']}
          dangerouslySetInnerHTML={{ __html: formatText(text) }}
        />
        {showButton && (
          <div
            className={`${styles['button-container']} ${
              centerButton ? styles.center : styles.left
            }`}
          >
            {isLink ? (
              <Link href={buttonLink}>
                <button className="button">
                  {buttonText}
                </button>
              </Link>
            ) : (
              <button className="button" onClick={() => window.location.href = buttonLink}>
                {buttonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentHolder;
