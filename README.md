# Mundo Alvarado — Programa de Beneficios

Sistema digital del Programa de Beneficios, Pertenencia y Crecimiento Societario del **Club Atlético Alvarado**.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + CSS Variables
- **Auth + DB**: Supabase (PostgreSQL + Auth)
- **Estado**: Zustand
- **Deploy**: Vercel

## Arquitectura

```
src/
├── app/                    # Rutas Next.js App Router
│   ├── dashboard/          # Área privada (requiere auth)
│   │   ├── page.tsx        # Inicio
│   │   ├── chances/        # Chances mensuales
│   │   ├── anual/          # Premio anual
│   │   ├── referidos/      # Mis referidos
│   │   ├── invitar/        # Invitar amigo
│   │   └── cuenta/         # Mi cuenta
│   ├── login/              # Login
│   ├── register/           # Registro
│   └── r/[alias]/          # Ruta pública de referido
├── components/             # Componentes reutilizables
├── lib/
│   ├── brio/               # Adaptador Brío (mock + interfaz real)
│   ├── business/           # Lógica de negocio (chances, referidos)
│   ├── mock/               # Datos mock para desarrollo
│   ├── supabase/           # Clientes Supabase (browser + server)
│   └── auth/               # Autenticación mock
├── store/                  # Estado global (Zustand)
├── types/                  # Tipos TypeScript centralizados
└── __tests__/              # Tests de lógica de negocio
supabase/
└── schema.sql              # Esquema PostgreSQL completo con RLS
```

## Cuenta de prueba (modo demo)

```
Email:    marcela@test.com
Password: test1234
```

## Configuración

1. Crear proyecto en Supabase
2. Ejecutar `supabase/schema.sql` en el SQL Editor
3. Copiar `.env.example` a `.env.local` y completar las variables
4. `npm install && npm run dev`

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://mundoalvarado.vercel.app
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_USE_MOCK_BRIO=true
```

## Tests

```bash
npm test               # Ejecutar tests
npm run test:coverage  # Tests con cobertura
```

## Integración con Brío (futura)

La integración con Brío está preparada en `src/lib/brio/`.  
Actualmente usa `MockBrioAdapter`. Cuando esté disponible la API real:

1. Crear `src/lib/brio/realBrioAdapter.ts` implementando `BrioAdapter`
2. Cambiar `NEXT_PUBLIC_USE_MOCK_BRIO=false` en `.env`
3. Sin modificar pantallas ni lógica de negocio

## Deploy

El proyecto está configurado para Vercel con Next.js.  
Configurar las variables de entorno en el dashboard de Vercel.
