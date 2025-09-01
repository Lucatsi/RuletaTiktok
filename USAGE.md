# 🎮 Guía de Uso - Ruleta TikTok

## 🚀 Inicio Rápido

### 1. Configuración Inicial

**Una sola vez:**
1. Ejecutar setup (Windows: `setup.bat`, Linux/Mac: `./setup.sh`)
2. Editar `backend/.env` con tus credenciales de PostgreSQL
3. Crear cuenta de usuario en http://localhost:3000

### 2. Uso Diario

**Para cada stream:**
1. `npm run dev` → Inicia la aplicación
2. Login en http://localhost:3000
3. Configurar usuario TikTok en ⚙️ Configuraciones
4. Elegir juego y abrirlo en pestaña nueva
5. Configurar captura en TikTok Live Studio
6. ¡Empezar el live!

---

## 🎯 Configuración de TikTok Live Studio

### Paso a Paso:

1. **Abrir TikTok Live Studio**
2. **Nueva fuente:**
   - `+` → "Captura de ventana"
   - Seleccionar la pestaña del juego
3. **Chroma Key:**
   - Clic derecho → "Filtros" → "Chroma Key"
   - Color: **#00FF00** (verde puro)
   - Tolerancia: 400-500
4. **Posicionar** donde quieras en tu stream

### ✅ Checklist Pre-Stream:

- [ ] Aplicación ejecutándose (`npm run dev`)
- [ ] Usuario TikTok configurado
- [ ] Juego abierto en pestaña separada
- [ ] TikTok Live Studio con captura configurada
- [ ] Chroma Key aplicado
- [ ] Posición ajustada
- [ ] ¡Listo para recibir donaciones!

---

## 🎮 Guía de Juegos

### 🎰 Ruleta de la Suerte
**Activación:** Cualquier regalo
**Efecto:** Gira automáticamente y selecciona premio
**Personalizable:** Premios, colores, probabilidades

### 🎯 Disparos al Avatar
**Activación:** Cualquier regalo
**Efecto:** Cada regalo = disparos, reduce vida
**Visual:** Animaciones de impacto, efectos de daño

### 💖 Barra de Vida
**Activación:** Regalos específicos
**Efectos por regalo:**
- 💚 Rose (+5), Heart (+10), Love (+15)
- 👑 Crown (+25), Lion (+50)
- 💔 Bomb (-20), Thunder (-15)
- 👥 Follows (+5)

### 🏆 Ranking de Donadores
**Activación:** Cualquier regalo
**Efecto:** Actualiza top 10 en tiempo real
**Mostrar:** Nombre, total monedas, último regalo

---

## 🛠️ Solución de Problemas

### ❌ "No se conecta a TikTok"
1. Verifica que estés **EN VIVO** en TikTok
2. Usuario TikTok **público** y correcto (sin @)
3. Recarga la página del juego
4. Revisa la consola del navegador (F12)

### ❌ "No detecta regalos"
1. Asegúrate de estar **realmente en vivo**
2. Pide a alguien que envíe un regalo **real**
3. Los regalos deben ser de **usuarios reales**
4. Verifica conexión en el chip verde del juego

### ❌ "Chroma Key no funciona"
1. Color exacto: **#00FF00**
2. Tolerancia: 400-500
3. No hay ventanas encima del juego
4. Pestaña del juego debe estar activa

### ❌ "Error de base de datos"
1. PostgreSQL ejecutándose
2. Credenciales correctas en `.env`
3. Base de datos `ruleta_tiktok` existe
4. Ejecutar `npm run migrate` de nuevo

### ❌ "Puerto ocupado"
```bash
# Windows - Liberar puerto 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# O cambiar puerto en vite.config.js
```

---

## 💡 Tips de Streaming

### Para Mejor Engagement:
1. **Explica los juegos** al inicio del live
2. **Reacciona** cuando el juego se active
3. **Agradece** las donaciones por nombre
4. **Personaliza** los mensajes de los juegos

### Configuración Recomendada:
- **Posición:** Esquina inferior derecha
- **Tamaño:** 25-30% de la pantalla
- **Transparencia:** 90-100% para chroma key
- **Audio:** Reacciones tuyas, no del juego

### Ideas de Contenido:
- **"Si llego a 100 de vida, hago X"**
- **"El top donador elige la próxima canción"**
- **"Cada jackpot = baile especial"**
- **"Meta: 50 regalos para regalo especial"**

---

## 📊 Estadísticas y Datos

### En el Dashboard verás:
- **Juegos jugados** total
- **Donaciones recibidas** por sesión
- **Promedio por juego**
- **Top donadores** históricos

### Cada juego muestra:
- Contador de eventos en tiempo real
- Última donación recibida
- Estadísticas de la sesión actual

---

## 🔄 Actualizaciones

### Para actualizar:
```bash
git pull origin main
npm run install-all
npm run migrate  # si hay cambios en BD
```

### Mantente al día:
- Revisa `CHANGELOG.md` para nuevas features
- Backup de tu base de datos periódicamente
- Personaliza configuraciones según tus necesidades

---

## 🆘 Soporte

**Si tienes problemas:**
1. 📖 Lee esta guía completa
2. 🔍 Revisa `INSTALL.md` para setup
3. 💬 Crea un Issue en GitHub con:
   - Descripción del problema
   - Pasos que realizaste
   - Error completo
   - Tu sistema operativo

**¡Disfruta creando contenido interactivo único!** 🎉

---

*Documentación actualizada para v1.0.0*
