// src/lib/business/privacy.ts
// ============================================================
// PRIVACIDAD DE LA RED
// ============================================================
// Un socio ve la ficha COMPLETA de sus referidos directos: son
// personas que invitó él mismo.
//
// De los referidos de sus referidos no ve más que el nombre de pila y
// el estado. Esa persona nunca aceptó ser vista por él: no la invitó,
// no la conoce, y probablemente no sepa que existe.
//
// Esta función es la ÚNICA puerta por la que los datos de segundo
// nivel llegan a la pantalla. No devuelve apellido, foto, categoría,
// número de socio, celular, email ni ningún identificador interno.
//
// Es el espejo en el cliente de la función `my_second_level()` de
// Supabase. Si algún día se agrega un campo acá, hay que agregarlo
// también allá — y va a viajar al navegador del socio.
//
// IMPORTANTE: ocultar un dato en la pantalla NO es privacidad. Si el
// dato llegó al navegador, se puede leer con las herramientas del
// desarrollador. Por eso la protección real está en la base de datos
// (ver supabase/migrations/20261007000000_privacy_second_level.sql) y
// este módulo existe para que la interfaz ni siquiera lo tenga a mano.
// ============================================================

import { EnrichedMember, MemberStatus } from '@/types';

/** Lo único que un socio puede saber de la red de sus referidos. */
export interface SecondLevelSummary {
  firstName: string;
  status: MemberStatus;
}

/**
 * Reduce una lista de socios a lo mínimo que el mapa del premio anual
 * necesita mostrar del segundo nivel.
 *
 * El estado sí se muestra: es lo que el socio necesita para entender de
 * dónde salen sus chances, y por sí solo no identifica a nadie.
 */
export function toSecondLevelSummaries(
  members: EnrichedMember[]
): SecondLevelSummary[] {
  return members.map((member) => ({
    firstName: member.firstName,
    status: member.status,
  }));
}
