import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jones & Associates — Criminal Defense',
  description: 'Forty years protecting the rights of the accused. Federal and state defense, sentencing, and post-conviction.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://adversarydata.com'),
  openGraph: {
    title: 'Jones & Associates',
    description: 'Forty years of principled criminal defense.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
