# 📁 Guía de Assets - Logos, Fotos e Iconos

## 🎨 ¿Dónde colocar tus archivos?

### Estructura de carpetas:

```
frontend/
├── public/                  ← Archivos estáticos (acceso directo por URL)
│   ├── logos/              ← Tu logo principal, favicon
│   ├── icons/              ← Iconos de juegos, UI
│   ├── images/             ← Fotos, backgrounds grandes
│   └── favicon.ico         ← Icono del navegador
│
└── src/
    └── assets/             ← Archivos procesados por Vite
        ├── images/         ← Imágenes importadas en componentes
        └── icons/          ← Iconos SVG como componentes
```

## 📝 Archivos que necesitas crear/subir:

### 🏷️ Logos (public/logos/):
- `logo-principal.png` - Logo principal (500x500px recomendado)
- `logo-blanco.png` - Logo en blanco para fondos oscuros
- `logo-oscuro.png` - Logo oscuro para fondos claros
- `logo-pequeño.png` - Logo pequeño para header (100x100px)
- `favicon.ico` - Icono del navegador (32x32px)

### 🎮 Iconos de Juegos (public/icons/):
- `ruleta-icon.png` - Icono de la ruleta
- `disparos-icon.png` - Icono de disparos
- `vida-icon.png` - Icono de barra de vida
- `ranking-icon.png` - Icono de ranking
- `tiktok-logo.png` - Logo de TikTok

### 🖼️ Imágenes (public/images/):
- `avatar-default.png` - Avatar por defecto
- `avatar-hurt.png` - Avatar dañado
- `ruleta-wheel.png` - Imagen de la ruleta personalizada
- `login-background.jpg` - Fondo de login (opcional)

## 💻 Cómo usar en tu código:

### Importar configuración:
```javascript
import ASSETS from '../config/assets';

// Usar en componente
<img src={ASSETS.logos.main} alt="Mi Logo" />
<img src={ASSETS.gameIcons.ruleta} alt="Ruleta" />
```

### Componente de Logo:
```javascript
import LogoComponent from '../components/LogoComponent';

// Diferentes tamaños
<LogoComponent size="small" />
<LogoComponent size="medium" />
<LogoComponent size="large" />
<LogoComponent variant="white" />
```

## 🎯 Recomendaciones de diseño:

### Formatos recomendados:
- **Logos:** PNG con transparencia
- **Iconos:** PNG o SVG (24x24, 48x48, 96x96px)
- **Fotos:** JPG para fotos, PNG para transparencia
- **Animaciones:** GIF o WEBP

### Paleta de colores sugerida:
- Primario: `#667eea` (Azul)
- Secundario: `#764ba2` (Púrpura)
- Chroma Key: `#00FF00` (Verde puro)
- Texto: `#ffffff` (Blanco) / `#000000` (Negro)

## 🚀 Pasos para agregar tus assets:

1. **Crear/conseguir tus archivos:**
   - Logo de tu marca/canal
   - Iconos personalizados (opcional)
   - Avatar personalizado (opcional)

2. **Subir archivos a las carpetas correctas:**
   ```
   frontend/public/logos/logo-principal.png
   frontend/public/icons/mi-icono.png
   frontend/public/images/mi-avatar.png
   ```

3. **Actualizar configuración:**
   - Editar `frontend/src/config/assets.js`
   - Cambiar rutas por las de tus archivos

4. **Usar en componentes:**
   - Importar ASSETS
   - Reemplazar emojis por tus imágenes

## 📱 Ejemplo completo:

Si tienes un logo llamado "mi-logo.png":

1. **Subir archivo:**
   ```
   frontend/public/logos/mi-logo.png
   ```

2. **Actualizar configuración:**
   ```javascript
   // en assets.js
   logos: {
     main: '/logos/mi-logo.png',
     // ...
   }
   ```

3. **Usar en código:**
   ```javascript
   <img src={ASSETS.logos.main} alt="Mi Logo" />
   ```

## 🎨 Herramientas recomendadas:

- **Crear logos:** Canva, GIMP, Photoshop
- **Iconos gratis:** Flaticon, Icons8, Feather Icons
- **Optimizar imágenes:** TinyPNG, Squoosh
- **Colores:** Coolors.co, Adobe Color

¡Con esto tendrás tu plataforma completamente personalizada! 🚀
