# Spec — API + seed · Análisis Mensual (backend)

**Slug:** `api-analisis-mensual`
**Ámbito:** solo `mesa-control-back`.
**Depende de:** `.claude/specs/dashboard-analisis-mensual.md` (el contrato lo fija el front, ya implementado).

## 1. Objetivo

Que la pantalla `/dashboard/analisis-mensual` deje de caer al estado vacío: (a) sembrar varios
meses de gestiones demo y (b) publicar el endpoint que las consolida.

Sin cambios de schema: `Gestion` ya tiene `resultado`, `motivo`, `ubicacion`, `fecha`.

## 2. Seed — meses históricos

Extender `prisma/seed.ts` + `src/seed/` (nuevo `src/seed/gestiones-mensuales.ts`) **sin tocar ni
romper** la jornada diaria actual que alimenta Monitor Diario (`gestiones-demo.ts`).

- Cubrir **los últimos 4 meses cerrados + el mes en curso**, calculados relativo a `hoy()`
  (nada de fechas fijas: el seed debe seguir sirviendo dentro de un año).
- Volumen por mes con forma realista y variada, del orden del diseño: ~1.200–1.700 gestiones en
  los meses cerrados y un mes en curso parcial (~400–500). Que la efectividad
  (`SOLUCIONADO_MESA / total`) varíe entre meses (aprox. 40 %–45 %) para que el KPI de meta
  se vea por debajo y por encima según el mes.
- `ubicacion`: las **21 zonas** del diseño del heatmap
  (`.claude/specs/design/AnalisisMensual.dc.html`, array `zones`): Canaima, Caraballeda, Carayaca,
  Caribe, Catia La Mar, Corapal, El Trébol, La Guaira, La Soublette, Las Tunitas, Macuto,
  Maiquetía, Mare Abajo, Mirabal, Montesano, OLT, Pariata, Simetaca, Tanaguarena, Tunitas, Zamora.
- `motivo`: reutilizar `MOTIVOS` de `gestiones-demo.ts` y añadir los del diseño que falten
  (Falla LOS, Internet Lento, Sin Internet, Usuario Clave GNT, Caídas Seguidas, No Navega),
  de modo que el heatmap tenga columnas con nombre reconocible.
- Distribución **determinista** (PRNG con semilla fija, como el `rnd()` del diseño): el seed debe
  producir exactamente lo mismo en cada corrida. Nada de `Math.random()`.
- **Idempotente**: ids deterministas + `createMany({ skipDuplicates: true })`, igual que hoy.
  Correr `npx prisma db seed` dos veces no duplica nada.
- Repartir las gestiones entre los operadores demo existentes.
- Reparto por zona/motivo **no uniforme**: unas pocas zonas concentran incidencias (para que la
  rampa de color del heatmap se aprecie), y bastantes celdas en 0.

## 3. Endpoint

`GET /dashboard/analisis-mensual?periodo=YYYY-MM` — protegido con JWT, igual que
`/dashboard/monitor-diario`. Documentado en Swagger. DTOs con `class-validator`
(`periodo` opcional, formato `^\d{4}-(0[1-9]|1[0-2])$`; por defecto, el mes en curso).

Respuesta — **debe casar exactamente** con `AnalisisMensualResponse` de
`mesa-control-front/src/lib/api/types.ts` (verifícalo leyendo ese archivo antes de implementar):

```jsonc
{
  "periodo": "2026-05",
  "kpis": {
    "volumen": 485,            // gestiones del mes
    "resueltos": 209,          // resultado = SOLUCIONADO_MESA
    "escalados": 22,           // resultado = ESCALADO_NOC
    "metaEfectividad": 65      // constante de negocio (65)
  },
  "serie": [                   // 4 meses: el pedido y los 3 anteriores, orden cronológico
    { "mes": "Febrero", "periodo": "2026-02", "resueltas": 545, "resto": 735 }
  ],
  "heatmap": {
    "motivos": ["Falla LOS", "…"],                     // top 6 motivos del mes por volumen
    "zonas": [{ "zona": "Canaima", "valores": [3, 0, 5, 1, 0, 2] }]  // len === motivos.length
  }
}
```

- `serie`: incluye meses sin gestiones como ceros (no los omitas) para que el chart no se
  descuadre. `mes` en español (`Febrero`), consistente con el resto del back.
- `heatmap.zonas`: solo zonas con al menos una incidencia en el mes, ordenadas alfabéticamente.
- Mes sin datos → `kpis` en 0, `heatmap.motivos: []`, `heatmap.zonas: []` (el front lo pinta como
  estado vacío). **No devolver 404.**
- Agregación en SQL/Prisma (`groupBy`), no traer las gestiones a memoria para contarlas.

## 4. Criterios de aceptación

1. Sin JWT → 401. Con JWT válido → 200 y el shape de arriba.
2. `periodo` inválido (`2026-13`, `mayo`) → 400 con mensaje claro.
3. Sin `periodo` → mes en curso.
4. Tras `npx prisma db seed`, el mes en curso y los 4 anteriores devuelven datos no vacíos, con
   heatmap de 6 motivos y ≥ 15 zonas.
5. El seed es idempotente y determinista (correrlo dos veces deja los mismos conteos).
6. Monitor Diario sigue funcionando igual: sus tests y su seed diario intactos.
7. `npm run lint`, `npm test` y `npm run test:e2e` en verde. Tests e2e nuevos para el endpoint
   (auth, validación, shape) y unit para la agregación y para el generador del seed.

## 5. Fuera de alcance

- Cambios de schema o migraciones.
- Seeds de otras pantallas (Historial, Fibex Play): ticket aparte cuando existan esas vistas.
