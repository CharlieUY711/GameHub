# GameHub - Arcade Multijugador

Plataforma de juegos multijugador con React + Vite + TypeScript.

## Juegos Disponibles

- **Ping Pong**: Multijugador en tiempo real con Supabase
- **Ruleta**: Casino multijugador con apuestas y fichas virtuales

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo `.env` con las variables de entorno:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_KEY=tu_key_de_supabase
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Build para producción:
```bash
npm run build
```

## Deploy en Vercel

El proyecto está configurado para deploy en Vercel con `vercel.json`. Solo necesitas:

1. Conectar tu repositorio a Vercel
2. Agregar las variables de entorno en la configuración de Vercel
3. Deploy automático

## Estructura del Proyecto

```
src/
  ├── App.tsx          # Menú principal arcade
  ├── main.tsx         # Entry point
  ├── index.css        # Estilos globales
  └── games/
      ├── PongView.tsx  # Juego Ping Pong
      └── RuletaView.tsx # Juego Ruleta
```

## Características

- Menú arcade con efectos de neón y tipografía retro
- Multijugador en tiempo real con Supabase
- Salas con códigos para unirse
- Sistema de fichas virtuales en la ruleta
- Responsive y optimizado para móviles
