import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mundo Alvarado — Programa de Beneficios',
  description:
    'Programa de Beneficios, Pertenencia y Crecimiento Societario del Club Atlético Alvarado.',
  keywords: ['Club Atlético Alvarado', 'Mundo Alvarado', 'socios', 'beneficios', 'Mar del Plata'],
  openGraph: {
    title: 'Mundo Alvarado — Programa de Beneficios',
    description: 'Programa de Beneficios, Pertenencia y Crecimiento Societario del Club Atlético Alvarado.',
    url: 'https://mundoalvarado.vercel.app',
    siteName: 'Mundo Alvarado',
    locale: 'es_AR',
    type: 'website',
  },
  robots: {
    index: false, // App privada
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
