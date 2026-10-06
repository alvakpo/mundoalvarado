'use client';

import { useSyncExternalStore } from 'react';

/** No hay nada a lo que suscribirse: sólo interesa el cambio de entorno. */
const noopSubscribe = () => () => {};

/**
 * Devuelve false mientras se renderiza en el servidor y true una vez que
 * el componente ya está montado en el navegador.
 *
 * Sirve para cualquier dato que viva en el navegador (puntos, sesión):
 * el servidor no puede saberlo, así que si se dibujara directo habría
 * una diferencia entre el HTML del servidor y el del cliente. React 19
 * lo trata como error de hidratación.
 *
 * Se usa useSyncExternalStore, que es la forma correcta de leer un dato
 * del entorno: el servidor devuelve false y el cliente true, sin
 * provocar renders en cascada ni setState dentro de un efecto.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
