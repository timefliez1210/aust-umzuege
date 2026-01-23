'use client';

import React, { useState } from 'react';
import styles from './Contact.module.css'; // Assuming a CSS module for styles

interface ContactProps {
  showButton?: boolean;
}

const Contact: React.FC<ContactProps> = ({ showButton = true }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    floor: '',
    distance: '',
    elevator: '',
    message: '',
  });

  

  

  

  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.append("form-name", "contact");
    data.append("bot-field", "");
    const formDataEncoded = new URLSearchParams(Array.from(data.entries()) as string[][]).toString();

    try {
      await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formDataEncoded,
      });
      alert("Formular erfolgreich gesendet!");
      window.location.href = "/success";
    } catch (error) {
      alert("Fehler beim Senden des Formulars: " + (error as Error).message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className={styles['contact-form']}>
      <h2>Schreiben Sie uns – Wir freuen uns auf Ihre Anfrage!</h2>
      <form name="contact" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" onSubmit={handleSubmit}>
        <input type="hidden" name="form-name" value="contact" />
        <input type="hidden" name="bot-field" />
        <div className={styles['honeypot-field']}>
          <label>
            Don&apos;t fill this out if you&apos;re human: <input name="bot-field" />
          </label>
        </div>

        {/* Name */}
        <div className={styles['form-group']}>
          <label htmlFor="name">Ihr Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ihr Name"
            required
          />
        </div>

        {/* Email */}
        <div className={styles['form-group']}>
          <label htmlFor="email">Ihre E-Mail-Adresse *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ihre E-Mail-Adresse"
            required
          />
        </div>

        {/* Phone */}
        <div className={styles['form-group']}>
          <label htmlFor="phone">Ihre Telefonnummer *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Ihre Telefonnummer"
            required
          />
        </div>

        {/* Address */}
        {/* <div className={styles['form-group']}>
          <label htmlFor="address">Adresse *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Straße, Hausnummer, PLZ, Ort"
            required
          />
        </div> */}

        

        {/* Message */}
        <div className={styles['form-group']}>
          <label htmlFor="message">Ihre Nachricht an uns (optional)</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Ihre Nachricht an uns"
          ></textarea>
        </div>

        {/* Submit Button */}
        {showButton && (
          <button type="submit" className={`${styles['submit-button']} button`}>
            Nachricht absenden
          </button>
        )}
      </form>
    </div>
  );
};

export default Contact;
