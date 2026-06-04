# AquaDash · Pack de Configuración de Umbrales

## Archivos en este paquete

```
aquadash-config/
├── README.md                                  ← este archivo
├── apply-config-patches.mjs                   ← script que modifica los archivos existentes
├── SQL_MIGRATION.sql                          ← migración para Supabase
└── src/
    ├── app/dashboard/configuracion/page.tsx   ← NUEVA página de configuración
    └── components/Sidebar.tsx                 ← Sidebar actualizada (con item Configuración)
```

---

## Pasos (3 minutos)

### 1) Copia los archivos nuevos a tu proyecto

Desde la carpeta `aquadash-config/`:

```bash
# Crea la carpeta de configuración y copia la página
mkdir -p src/app/dashboard/configuracion
cp src/app/dashboard/configuracion/page.tsx  TU_PROYECTO/src/app/dashboard/configuracion/page.tsx

# Sustituye el Sidebar (haz backup primero si quieres)
cp src/components/Sidebar.tsx  TU_PROYECTO/src/components/Sidebar.tsx
```

O simplemente arrastra los dos archivos a sus carpetas correspondientes en tu IDE.

### 2) Aplica los parches a los archivos existentes

```bash
# Copia el script a la RAÍZ de tu proyecto (donde está package.json)
cp apply-config-patches.mjs  TU_PROYECTO/apply-config-patches.mjs

# Desde la raíz del proyecto, ejecuta:
cd TU_PROYECTO
node apply-config-patches.mjs
```

El script:
- Modifica `src/lib/store.tsx` (umbrales en el context + persistencia)
- Modifica `src/app/dashboard/piscinas/page.tsx` (usa umbrales dinámicos)
- Modifica `src/app/dashboard/recirculacion/page.tsx` (usa umbrales dinámicos)
- Modifica `src/lib/i18n.ts` (traducción del nuevo menú)
- **Crea backups `.bak`** de cada archivo antes de modificarlo
- Es **idempotente**: puedes ejecutarlo varias veces sin riesgo

### 3) Ejecuta la migración SQL

**Opción A — Supabase Dashboard:**
1. Ve a tu proyecto Supabase (`rdhtrzgjhwasrculdwrj`)
2. SQL Editor → New query
3. Copia y pega el contenido de `SQL_MIGRATION.sql`
4. Pulsa **Run**

**Opción B — Vía MCP Supabase (si lo usas):**
```
apply_migration con name="app_config_thresholds_seed" y el contenido del SQL
```

### 4) Verifica

```bash
npm run dev
```

- ✅ Compila sin errores TypeScript
- ✅ Inicia sesión como **admin** → verás `⚙️ Configuración` en el menú lateral
- ✅ Inicia sesión como otro rol → el item NO aparece
- ✅ Modifica un umbral (ej. cloro libre min → 0.6), pulsa **Guardar cambios**
- ✅ Ve a **Piscinas** → mete una lectura con cloro libre = 0.55 → debe colorearse en naranja/rojo
- ✅ Recarga la página → los umbrales se mantienen (persistencia en `app_config`)
- ✅ Pulsa **Restablecer por defecto** → vuelven a los valores RD 742/2013

---

## ¿Algo va mal?

### El script da error "No se encontró el patrón"
Significa que tu archivo ya tiene modificaciones que no coinciden con el patrón original. Restaura desde el backup `.bak` y reporta qué patch falló.

### Quiero deshacer todos los cambios
```bash
# Restaura cada .bak
find src -name "*.bak" -exec sh -c 'mv "$1" "${1%.bak}"' _ {} \;
```

### El menú no aparece
- ¿Estás logueado como admin? El item es admin-only.
- ¿Has copiado el nuevo Sidebar.tsx? Comprueba que existe `nav_configuracion` en su array NAV_ITEMS.

### Los cambios de umbral no afectan a las alertas
- ¿Has ejecutado la migración SQL? Sin las filas en `app_config`, los umbrales no se cargan.
- ¿El usuario tiene permiso de admin? Solo admin puede editar.
- ⚠️ Las alertas ya existentes NO se regeneran retroactivamente — sólo las nuevas usarán el nuevo umbral. Esto es por diseño (trazabilidad).

---

## Detalles técnicos

### Qué hace el script con `store.tsx`
1. Renombra `THRESHOLDS` → `DEFAULT_THRESHOLDS` (deja `THRESHOLDS` como alias).
2. Añade `DEFAULT_TEMP_AGUA_THRESHOLDS`, `DEFAULT_RECIRC_THRESHOLDS`, `DEFAULT_CONTADORES_THRESHOLDS`.
3. Amplía la `interface AppState` con: `thresholds`, `tempAguaThresholds`, `recircThresholds`, `contadoresThresholds`, y sus funciones `update*`/`reset*`.
4. Añade `useState` para cada uno.
5. En `loadAll()` lee de `app_config` las claves `thresholds`, `temp_agua_thresholds`, `recirc_thresholds`, `contadores_thresholds`.
6. Añade funciones `persistConfig`, `updateThresholds`, `updateTempAguaThresholds`, etc.
7. Dentro de `generateAlertsFromNewParam` sustituye `THRESHOLDS.x` por `thresholds.x` y `TEMP_AGUA_THRESHOLDS[pool]` por `tempAguaThresholds[pool]` — para que las alertas usen los umbrales en vivo.

### Qué hace con `piscinas/page.tsx`
- Quita las funciones top-level `getTempRange` y `valueClassPool` (no podían acceder al context).
- Las recrea como helpers DENTRO del componente, donde sí tienen acceso a `thresholds`/`tempAguaThresholds` del `useApp()`.
- Sustituye los literales hardcodeados (`0.5`, `2.0`, `7.2`, `7.8`, etc.) en el bloque de issues y tarjetas de resumen por referencias dinámicas.
- Cambia la firma de `exportPDF` para recibir `tempAguaThresholds` (porque ya no tiene acceso top-level).

### Qué hace con `recirculacion/page.tsx`
- Elimina la constante local `DELTA_WARN` (ahora vive en el store).
- Añade `recircThresholds` al destructuring de `useApp()`.
- Sustituye `DELTA_WARN[selectedPool]` y `DELTA_WARN[pool]` por `recircThresholds[...]`.

### Qué NO toca (por diseño)
- **PDFs**: los textos legales del PDF (ej. `0.5–2.0`, `7.2–7.8`) siguen siendo los valores oficiales RD 742/2013 como referencia legal. Si quieres dinamizarlos, dímelo.
- **Página `app/dashboard/page.tsx` (home)**: usa `THRESHOLDS` que sigue siendo el alias de `DEFAULT_THRESHOLDS`. Funciona pero no es reactivo. Si lo quieres reactivo, dímelo.
- **Legionella `page.tsx`**: KPIs con literales (`>= 50°C`, etc.). Mismo caso. Te paso parche si quieres.
- **Contadores**: los umbrales se guardan pero NO generan alertas (contadores no tenían alertas previamente). Listos para cablear cuando lo necesites.
