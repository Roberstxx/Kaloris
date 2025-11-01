# Contadorrrr

Aplicación web para el seguimiento nutricional diario, construida con React y Vite. Permite registrar la ingesta de alimentos, visualizar el progreso mediante métricas y gráficas, y ajustar objetivos personalizados de macronutrientes y calorías.

## Autor

- Contadorrrr

## Características principales

- **Autenticación con Firebase** para acceder de manera segura a la información personal.
- **Panel principal** con indicadores de progreso diario y resúmenes semanales.
- **Registro histórico** de peso, calorías y macronutrientes con visualizaciones interactivas.
- **Configuración personalizable** de objetivos nutricionales, nivel de actividad y datos biométricos.
- **Exportación** de información en PDF para compartir o respaldar los avances.

## Stack tecnológico

- [React](https://react.dev/) 18 + [Vite](https://vitejs.dev/) para la interfaz y el entorno de desarrollo.
- [TypeScript](https://www.typescriptlang.org/) para tipado estático.
- [Tailwind CSS](https://tailwindcss.com/) y [shadcn/ui](https://ui.shadcn.com/) para el diseño de componentes.
- [React Router](https://reactrouter.com/) para la navegación entre pantallas.
- [React Query](https://tanstack.com/query/latest) para el manejo de datos asíncronos.
- [Firebase](https://firebase.google.com/) como backend de autenticación y persistencia.

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior.
- [npm](https://www.npmjs.com/) (instalado con Node.js) o [Bun](https://bun.sh/) si se desea usar la alternativa al CLI de npm.
- Credenciales de Firebase configuradas en variables de entorno (ver sección de configuración).

## Configuración del entorno

1. Clonar el repositorio y entrar a la carpeta del proyecto:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd Contadorrrr
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear un archivo `.env` basado en `.env.example` y completar las variables de Firebase (todas deben iniciar con `VITE_`).
4. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir el proyecto en `http://localhost:5173`.

## Scripts disponibles

| Comando            | Descripción                                                  |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Inicia el servidor de desarrollo con recarga en caliente.    |
| `npm run build`    | Genera una compilación lista para producción en `dist/`.     |
| `npm run preview`  | Sirve la compilación de producción para revisión local.      |
| `npm run lint`     | Ejecuta ESLint sobre el código fuente.                       |
| `npm run build:dev`| Construcción de desarrollo para validar variables y assets.  |

## Estructura del proyecto

```
src/
├── components/         # Componentes reutilizables de UI y lógica
├── context/            # Providers y hooks de contexto (sesión, tema, etc.)
├── hooks/              # Hooks personalizados
├── lib/                # Utilidades compartidas y servicios
├── pages/              # Páginas principales de la aplicación
├── routes/             # Definiciones de rutas y protección de vistas
└── types/              # Tipos y contratos compartidos en TypeScript
```

## Flujo de trabajo recomendado

1. Crear una rama para cada cambio: `git checkout -b feature/nueva-funcionalidad`.
2. Realizar commits descriptivos y pequeños.
3. Ejecutar `npm run lint` y `npm run build` antes de abrir un pull request.
4. Abrir un PR hacia `main` y solicitar revisión.

## Despliegue

El proyecto se ha desplegado exitosamente en Vercel. Para realizar un nuevo despliegue:

1. Crear un proyecto en [Vercel](https://vercel.com/) e importar este repositorio.
2. Configurar las variables de entorno en la sección **Project Settings → Environment Variables**.
3. Usar los valores por defecto: comando `npm run build` y directorio de salida `dist`.
4. Cada push a `main` generará un nuevo despliegue automático.

## Licencia

Este proyecto es de uso privado. Consultar al autor para cualquier reutilización del código.

