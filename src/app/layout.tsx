import type { Metadata } from 'next';
import './globals.css';

// Vercel expone el SHA del commit en tiempo de build. Lo dejamos en una
// meta etiqueta invisible para poder responder, desde afuera y sin
// loguearse, la pregunta "¿qué versión está publicada?".
//   ver:  curl -s https://mundoalvarado.vercel.app/login | grep app-commit
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local';

export const metadata: Metadata = {
  title: 'Mundo Alvarado — Programa de Beneficios',
  description:
    'Programa de Beneficios, Pertenencia y Crecimiento Societario del Club Atlético Alvarado.',
  keywords: ['Club Atlético Alvarado', 'Mundo Alvarado', 'socios', 'beneficios', 'Mar del Plata'],
  other: {
    'app-commit': COMMIT,
  },
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
