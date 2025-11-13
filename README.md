# Kaloris

Aplicación web para el seguimiento nutricional diario orientada a personas que desean monitorear su ingesta calórica, progresos y hábitos. Está construida con React + Vite y se apoya en Firebase para autenticación/persistencia y en Cloudinary para la subida opcional de avatares.

## Tabla de contenidos
- [Visión general](#visión-general)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura y flujo de la aplicación](#arquitectura-y-flujo-de-la-aplicación)
  - [Estados globales](#estados-globales)
  - [Rutas y navegación](#rutas-y-navegación)
  - [Secuencias clave](#secuencias-clave)
- [Modelo de datos y persistencia](#modelo-de-datos-y-persistencia)
- [Servicios externos](#servicios-externos)
- [Requisitos previos](#requisitos-previos)
- [Configuración local paso a paso](#configuración-local-paso-a-paso)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Estilos y componentes de UI](#estilos-y-componentes-de-ui)
- [Reportes y exportaciones](#reportes-y-exportaciones)
- [Pruebas y aseguramiento de calidad](#pruebas-y-aseguramiento-de-calidad)
- [Despliegue en producción](#despliegue-en-producción)
- [Diagramas recomendados](#diagramas-recomendados)
- [Resolución de problemas comunes](#resolución-de-problemas-comunes)
- [Guía de contribución](#guía-de-contribución)
- [Licencia](#licencia)

## Visión general
- Registro de ingestas calóricas y macronutrientes con clasificación automática por horario (desayuno, comida, cena) y control de duplicados.
- Panel principal con métricas agregadas del día (kcal totales), cumplimiento semanal, mejores días y rachas.
- Historias de progreso y exportación de reportes en PDF para compartir avances.
- Perfil nutricional configurable (sexo, edad, peso, altura, nivel de actividad) con cálculo automático de TDEE mediante la fórmula de Mifflin-St Jeor.
- Personalización de tema (claro/oscuro) sincronizada entre dispositivos y respetando la preferencia del sistema.

## Stack tecnológico
- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) con [TypeScript](https://www.typescriptlang.org/).
- **Estado global:** React Context (Session, Theme e Intake).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/), módulos CSS y componentes de [shadcn/ui](https://ui.shadcn.com/).
- **Datos remotos:** [Firebase Authentication](https://firebase.google.com/products/auth) y [Cloud Firestore](https://firebase.google.com/products/firestore).
- **Almacenamiento de medios:** [Cloudinary](https://cloudinary.com/) para avatares.
- **Utilidades adicionales:** React Router, TanStack Query (para futuras integraciones), jsPDF para exportes y localStorage como caché offline.

## Arquitectura y flujo de la aplicación
### Estados globales
- `SessionProvider` (`src/context/SessionContext.tsx`): gestiona autenticación con Firebase, sincroniza el perfil extendido (`profiles/{uid}`) y mantiene un fallback en `localStorage`. Expone `user`, banderas de carga, métodos `login`, `register`, `logout`, `updateProfile` y `updatePreferences`.
- `ThemeProvider` (`src/context/ThemeContext.tsx`): se apoya en `SessionProvider` para persistir la preferencia del tema, respeta la configuración del sistema y guarda un espejo en `localStorage`.
- `IntakeProvider` (`src/context/IntakeContext.tsx`): controla los registros diarios (`dailyLogs`), calcula métricas semanales (`calculateWeeklySummary`) y mantiene sincronía bidireccional con Firestore y el almacenamiento local. Expone operaciones para agregar, editar, eliminar, deshacer y resetear entradas, además de el resumen semanal y la meta calórica vigente.

### Rutas y navegación
El enrutado está definido en `src/App.tsx` usando `react-router-dom`:
- Rutas públicas: `/login`, `/register` y un `Navigate` que redirige `/` hacia `/login`.
- Rutas protegidas por sesión (`RequireAuth`): `/registro` para completar el perfil inicial.
- Rutas protegidas por perfil completo (`RequireProfile`): `/dashboard`, `/historial`, `/settings`, `/streak`.
- `/splash` muestra un loader full-screen reutilizable mientras la sesión se resuelve.

### Secuencias clave
1. **Registro de usuario**
   1. `register` crea la cuenta en Firebase Auth, almacena el perfil base en Firestore/localStorage y redirige al onboarding.
   2. El usuario completa datos físicos en `/registro`; al enviarlos se calculan TDEE y metas y se almacenan mediante `updateProfile`.
2. **Inicio de sesión**
   1. `login` escucha el estado de Firebase (`authApi.onChange`).
   2. Al autenticarse, `SessionProvider` sincroniza `profiles/{uid}` y marca `profileComplete` según los campos obligatorios.
3. **Registro diario de alimentos**
   1. `IntakeProvider.addEntry` normaliza la hora (`normalizeConsumedAt`) y clasifica el tipo de comida (`classifyMealByTime`).
   2. Detecta duplicados y agrupa unidades; persiste en `localStorage` y en `dailyLogs/{uid}_{fecha}`.
   3. Recalcula el total del día y actualiza estadísticas semanales (`calculateWeeklySummary` + `calculateStreakStats`).
4. **Exportación de reporte**
   1. `exportToPDF` (`src/utils/pdf.ts`) genera un documento con datos personales, metas y alimentos ingeridos para el día seleccionado.

## Modelo de datos y persistencia
La app interactúa con las siguientes colecciones de Firestore (ver `firebase/firestore.rules`):
- `profiles/{uid}`: perfil extendido (sexo, métricas físicas, preferencias, avatar, metas calóricas).
- `profiles/{uid}/stats/weekly`: resumen semanal calculado por el cliente (total, promedio, cumplimiento, rachas).
- `dailyLogs/{uid_fecha}`: documento por día con entradas (`IntakeEntry[]`) y calorías totales.

La lógica local mantiene un espejo en `localStorage` para funcionar offline y hacer seed inicial en Firestore si el usuario inicia sesión en un dispositivo nuevo.

## Servicios externos
| Servicio    | Uso en la app | Configuración |
|-------------|---------------|---------------|
| Firebase Auth & Firestore | Autenticación email/password y persistencia de perfiles/logs. | Variables `VITE_FIREBASE_*` en `.env`. El build muestra un banner si faltan valores (`firebaseConfigIssues`). |
| Cloudinary | Subida opcional de avatares/medios desde `src/lib/cloudinary.ts`. | Variables `VITE_CLOUDINARY_CLOUD_NAME` y `VITE_CLOUDINARY_UPLOAD_PRESET`. Usa presets *unsigned*. |

## Requisitos previos
- [Node.js](https://nodejs.org/) 18 o superior.
- [npm](https://www.npmjs.com/) instalado con Node (puedes usar [Bun](https://bun.sh/) si prefieres: hay `bun.lockb`).
- Cuenta de Firebase con proyecto configurado y Firestore habilitado.
- (Opcional) Cuenta de Cloudinary con preset sin firmar para uploads desde cliente.

## Configuración local paso a paso
1. Clonar el repositorio e ingresar a la carpeta del proyecto:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd Kaloris
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar el archivo de variables y rellenar credenciales:
   ```bash
   cp .env.example .env
   ```
   Completa todas las claves `VITE_FIREBASE_*`. Para Cloudinary define `VITE_CLOUDINARY_CLOUD_NAME` y `VITE_CLOUDINARY_UPLOAD_PRESET` si habilitarás subida de avatares.
4. Ejecutar el entorno de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir `http://localhost:5173` en el navegador. El servidor soporta recarga en caliente.

> **Nota:** si deseas usar Bun ejecuta `bun install` y `bun dev`, pero asegúrate de mantener el lockfile correspondiente.

## Scripts disponibles
| Comando            | Descripción |
|--------------------|-------------|
| `npm run dev`      | Inicia Vite en modo desarrollo con HMR.
| `npm run build`    | Genera la versión optimizada en `dist/`.
| `npm run preview`  | Sirve la build de producción para verificación local.
| `npm run lint`     | Ejecuta ESLint sobre `src/`.
| `npm run build:dev`| Build intermedia útil para validar variables y assets durante CI/CD.

## Estructura del repositorio
```
src/
├── api/                    # Clientes HTTP o stubs (para futuras integraciones)
├── assets/                 # Iconos, imágenes y fuentes estáticas
├── components/             # Componentes reutilizables de UI y layout
├── context/                # Providers globales (sesión, tema, ingesta)
├── data/                   # Datos semilla/constantes
├── hooks/                  # Hooks personalizados (ej. calculadora TDEE)
├── lib/                    # Integraciones externas (Firebase, Cloudinary) y helpers de ruta
├── pages/                  # Vistas principales (Dashboard, Historial, Settings, etc.)
├── utils/                  # Funciones puras de fechas, validaciones, estadísticas, PDF
├── App.tsx / main.tsx      # Entradas de React y configuración de rutas/providers
└── index.css / App.css     # Estilos globales
```
Otros archivos relevantes:
- `firebase/firestore.rules`: reglas de seguridad sugeridas para desplegar en Firebase.
- `tailwind.config.ts`: configuración de temas, colores y plugins de Tailwind.
- `components.json`: catálogo de componentes de shadcn/ui disponibles.

## Estilos y componentes de UI
- Se usan módulos CSS (`*.module.css`) en páginas clave (`Dashboard`, `Registro`, `Settings`) para encapsular estilos específicos.
- Tailwind se aplica para layout rápido y variantes de estado. El tema activo (`light/dark`) se controla con el atributo `data-theme` en `<html>`.
- Componentes de shadcn/ui aportan patrones accesibles (botones, dialogs). Ajustar tokens en `tailwind.config.ts` si necesitas personalizar colores.

## Reportes y exportaciones
- `src/utils/pdf.ts` construye un reporte PDF con datos de usuario, totales y listado de alimentos consumidos.
- `src/utils/stats.ts` provee cálculos de promedio, cumplimiento, tendencia y rachas (`calculateStreakStats`). Estas métricas alimentan las gráficas y tarjetas del Dashboard.
- Para diagramas o integraciones BI puedes reutilizar el resumen semanal persistido en `profiles/{uid}/stats/weekly`.

## Pruebas y aseguramiento de calidad
Actualmente no existen tests automatizados, pero se recomienda:
1. Ejecutar `npm run lint` antes de cada commit.
2. Validar la build con `npm run build` (especialmente útil para detectar variables de entorno faltantes).
3. Probar los flujos críticos manualmente (login, onboarding, registro diario, exportación a PDF) tras cambios en contextos.

## Despliegue en producción
El proyecto está optimizado para [Vercel](https://vercel.com/):
1. Importa el repositorio en Vercel y selecciona el framework **Vite** (config automática).
2. Define las variables de entorno en *Project Settings → Environment Variables* (usa Scope `Production` y `Preview`).
3. Comando de build: `npm run build`. Directorio de salida: `dist`.
4. Cada push a `main` gatilla un despliegue automático. Si faltan credenciales, la app mostrará un banner indicando las claves ausentes (`SessionProvider`).

Para otras plataformas (Netlify, Firebase Hosting) asegúrate de exponer las variables `VITE_*` y servir el contenido estático de `dist/`.

## Diagramas recomendados
Para documentar el sistema puedes partir de los siguientes diagramas:
- **Diagrama de arquitectura**: `Browser → React (Providers + Pages) → Firebase (Auth/Firestore) → Cloudinary`. Destaca la caché local (`localStorage`).
- **Diagrama de secuencia de registro**: Usuario → `Register.tsx` → `SessionProvider.register()` → Firebase Auth → Firestore.
- **Diagrama de secuencia de ingesta diaria**: Usuario → componente de captura → `IntakeProvider.addEntry()` → Firestore → `weeklyStats`.
- **Diagrama de estado** para el perfil: `Sin sesión` → `Autenticado` → `Perfil incompleto` → `Perfil completo` (habilita Dashboard/Historial/Settings).

## Resolución de problemas comunes
| Problema | Causa probable | Solución |
|----------|----------------|----------|
| Banner "Configura tus credenciales de Firebase" | Variables `VITE_FIREBASE_*` ausentes o vacías. | Verifica `.env` o configuración en Vercel. La consola indica las claves faltantes. |
| Error al subir avatar | Faltan `VITE_CLOUDINARY_*` o preset inválido. | Crear preset sin firmar y actualizar variables. |
| No se guardan registros diarios | Usuario sin sesión o Firestore sin permisos. | Revisa reglas (`firebase/firestore.rules`) y que `request.auth.uid` coincida. |
| Totales desfasados tras medianoche | La app detecta rollover cada 30 s. Si la pestaña estuvo inactiva, vuelve a enfocarla para forzar `validateRollover`. |

## Guía de contribución
1. Crea una rama descriptiva (`feature/nueva-funcionalidad`).
2. Asegura commits pequeños y con mensajes claros.
3. Ejecuta `npm run lint` y `npm run build` antes de abrir el PR.
4. Describe los cambios y adjunta capturas si afectan la UI. Considera actualizar este README si modificas el flujo principal.

## Licencia
Proyecto de uso privado. Contacta al autor antes de reutilizar o redistribuir el código.
