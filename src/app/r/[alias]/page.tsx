// src/app/r/[alias]/page.tsx
// Ruta pública de referido: /r/{alias}
// Guarda el referral code en sessionStorage y redirige al registro

import { redirect } from 'next/navigation';
import { MOCK_MEMBERS } from '@/lib/mock/mockData';

interface Props {
  params: Promise<{ alias: string }>;
}

export default async function ReferralRedirectPage({ params }: Props) {
  const { alias } = await params;

  // Buscar el referente por alias o código
  const referrer = MOCK_MEMBERS.find(
    (m) => m.publicAlias.toLowerCase() === alias.toLowerCase() ||
           m.referralCode.toLowerCase() === alias.toLowerCase()
  );

  if (!referrer) {
    redirect('/register');
  }

  // Redirigir al registro con el código de referido
  redirect(`/register?ref=${referrer.referralCode}`);
}
