import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)', // Adjust based on your header/footer height
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>404 - Seite nicht gefunden</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
        Die angeforderte Seite konnte nicht gefunden werden. Möglicherweise wurde sie verschoben oder existiert nicht mehr.
      </p>
      <Link href="/" style={{
        backgroundColor: '#cc4d00',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        textDecoration: 'none',
        fontSize: '1.1rem'
      }}>
        Zur Startseite
      </Link>
    </div>
  );
}
