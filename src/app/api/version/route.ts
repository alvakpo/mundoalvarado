import { NextResponse } from 'next/server';

// Endpoint público, sin autenticación y sin datos sensibles: sólo
// responde qué versión del código está desplegada.
//
// Existe porque las pantallas de la app están detrás del login y se
// dibujan en el navegador, así que desde afuera no hay forma de saber
// si un cambio llegó a producción. Esto lo resuelve:
//
//   curl https://mundoalvarado.vercel.app/api/version
//
// Vercel inyecta estas variables en tiempo de build. Con force-static
// quedan congeladas en el momento del build, que es justo lo que se
// quiere medir.
export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    environment: process.env.VERCEL_ENV ?? 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    builtAt: new Date().toISOString(),
  });
}
