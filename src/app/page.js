import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Welcome to the Main Page</h1>
      <p>This is a simplified main page.</p>
      <Link href="/checklist">Go to Checklist</Link>
    </main>
  );
}
