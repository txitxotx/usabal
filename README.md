# 🏊 Aqua Dashboard

Dashboard profesional para gestión de instalaciones acuáticas: piscinas, contadores, legionella e incendios.

## Funcionalidades

- **🏠 Panel principal** — KPIs diarios, estado de piscinas, alertas recientes
- **🏊 Piscinas** — Cloro libre, cloro combinado, pH, temperatura, turbidez por instalación
- **📊 Contadores** — Agua, gas, electricidad, accesos, kW con gráficos históricos
- **🧫 Legionella** — Temperaturas ACS (retorno + depósitos), biocida y pH
- **🔥 Incendios** — Revisiones de extintores, BIE, detectores, salidas de emergencia
- **🔔 Alertas** — Detección automática de valores fuera de rango con severidad
- **👥 Usuarios** — Gestión de roles y permisos granulares por sección

## Usuarios de demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@aquadash.com | admin123 | Admin (todo) |
| supervisor@aquadash.com | super123 | Supervisor (ver + editar + exportar) |
| jon@aquadash.com | jon123 | Operario (ver + editar) |
| readonly@aquadash.com | view123 | Solo lectura |

## Umbrales de alerta

| Parámetro | Mínimo | Máximo |
|-----------|--------|--------|
| Cloro libre | 0.5 mg/L | 2.0 mg/L |
| Cloro combinado | — | 0.6 mg/L |
| pH piscinas | 7.2 | 7.8 |
| Turbidez | — | 0.5 NTU |
| Temp. retorno ACS | 50°C | 65°C |
| Temp. depósitos | 60°C | 70°C |
| Biocida | 0.2 mg/L | 2.0 mg/L |
| pH ACS | 7.0 | 8.0 |

## Instalación local

```bash
npm install
npm run dev

```

Abre http://localhost:3000

## Despliegue en Vercel desde GitHub

1. Sube este proyecto a GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/aqua-dashboard.git
git push -u origin main
```

2. Ve a [vercel.com](https://vercel.com) → **New Project**
3. Importa tu repositorio de GitHub
4. Vercel detecta automáticamente Next.js — haz clic en **Deploy**
5. En 2 minutos tienes tu URL pública 🎉

## Variables de entorno (opcional para producción)

Para una base de datos real en producción, añade en Vercel:

```
DATABASE_URL=...
NEXTAUTH_SECRET=...
```

## Stack tecnológico

- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** para estilos
- **Recharts** para gráficos
- **LocalStorage** para persistencia de usuarios (en demo)

## Próximos pasos

- [ ] Integrar base de datos (PostgreSQL en Supabase o PlanetScale)
- [ ] Autenticación con NextAuth.js
- [ ] Importación de Excel para cargar datos históricos
- [ ] Exportación a PDF/Excel
- [ ] Notificaciones por email cuando hay alertas críticas
- [ ] Piscinas exteriores (P. Ext. Grande, P. Ext. Pequeña, Splash)
- [ ] Sección de purgas semanales/mensuales
- [ ] Registro de análisis de laboratorio (E.coli, Pseudomonas)
