# Sistema de Ruleta con Historial - Guía de Uso

## 🚀 Configuración Inicial

### 1. Base de Datos
Antes de usar el sistema, necesitas configurar las tablas de historial:

```bash
# Ejecutar el script de configuración de base de datos
.\setup-roulette-db.bat
```

O manualmente ejecutar:
```sql
psql -h 127.0.0.1 -U postgres -d ruletiktok -f "database\roulette-history.sql"
```

### 2. Iniciar el Backend
```bash
cd backend
npm install
npm start
```

### 3. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Funcionalidades Implementadas

### ✅ Configuración de Ruleta
- **Crear configuraciones personalizadas**: Puedes crear múltiples configuraciones de ruleta con diferentes opciones
- **Editar opciones existentes**: Modificar texto, color, emoji y rareza de cada opción
- **Guardar y cargar configuraciones**: Las configuraciones se guardan en la base de datos
- **Selector de configuraciones**: Cambiar entre diferentes configuraciones guardadas

### ✅ Sistema de Giros Funcional
- **Giro animado**: La ruleta gira con animaciones fluidas
- **Cálculo preciso del ganador**: Algoritmo que determina exactamente qué opción ganó
- **Registro automático**: Cada giro se guarda automáticamente en la base de datos
- **Estadísticas en tiempo real**: Contador de giros se actualiza automáticamente

### ✅ Alerta de Ganador
- **Modal de ganador**: Se muestra automáticamente cuando termina el giro
- **Botón de cerrar funcional**: Puedes cerrar la alerta manualmente
- **Auto-cierre**: Se cierra automáticamente después de 5 segundos
- **Información completa**: Muestra emoji, nombre y rareza del premio

### ✅ Sistema de Historial Completo
- **Historial detallado**: Registro de todos los giros con fecha, hora, resultado y duración
- **Modal de historial**: Interfaz para ver todo el historial de giros
- **Filtros por sesión**: El historial se organiza por sesiones de streaming
- **Información completa**: Cada entrada muestra ganador, número de giro, viewers, etc.

### ✅ Gestión de Historial
- **Eliminar historial**: Botón para borrar completamente el historial de una ruleta
- **Confirmación**: Sistema de confirmación antes de eliminar
- **Resetear estadísticas**: Función para resetear contadores y historial
- **Actualización en tiempo real**: El historial se actualiza automáticamente

## 🎮 Cómo Usar la Ruleta

### Configurar la Ruleta
1. Haz clic en **⚙️ CONFIGURAR**
2. Selecciona una configuración existente o modifica la actual
3. Para cada opción puedes cambiar:
   - **Texto**: El nombre que aparece
   - **Color**: Color de fondo de la sección
   - **Emoji**: Icono que representa el premio
   - **Rareza**: Común, Poco común, Raro, Épico, Legendario
4. Usa **➕ Agregar Opción** para añadir nuevas opciones
5. Usa **🗑️** para eliminar opciones (mínimo 2 opciones)
6. Haz clic en **Guardar** para aplicar los cambios

### Girar la Ruleta
1. Haz clic en **🎰 GIRAR RULETA**
2. La ruleta girará con efectos visuales
3. Aparecerá automáticamente el resultado ganador
4. El giro se registra automáticamente en el historial

### Ver Historial
1. Haz clic en **📊 HISTORIAL**
2. Verás todos los giros registrados con:
   - Número de giro
   - Resultado ganador
   - Fecha y hora
   - Duración del giro
   - Número de viewers
3. Usa **🔄 Actualizar** para refrescar los datos

### Resetear Estadísticas
1. Haz clic en **🔄 RESETEAR**
2. Confirma la acción
3. Se resetearán:
   - Contador de giros
   - Estadísticas de la sesión
   - Posición de la ruleta

### Eliminar Historial
1. Haz clic en **🗑️ BORRAR**
2. Confirma que quieres eliminar el historial
3. Se eliminará permanentemente:
   - Todo el historial de giros de la ruleta actual
   - Las estadísticas asociadas

## 🗃️ Estructura de la Base de Datos

### Tablas Principales
- **roulette_configurations**: Guarda las configuraciones de ruleta
- **roulette_history**: Registra cada giro individual
- **roulette_session_stats**: Estadísticas agregadas por sesión

### Datos Guardados por Giro
- Configuración de ruleta usada
- Opción ganadora completa
- Número de giro en la sesión
- Grados de rotación exactos
- Duración del giro
- Número de viewers
- Si fue activado por donación
- Timestamp del giro

## 🚨 Solución de Problemas

### Error de Conexión a Base de Datos
1. Verifica que PostgreSQL esté ejecutándose
2. Confirma las credenciales en `backend/models/database.js`
3. Ejecuta el script de configuración: `.\setup-roulette-db.bat`

### La Configuración No Se Guarda
1. Verifica que el backend esté ejecutándose
2. Revisa que el usuario esté autenticado
3. Confirma que las tablas de ruleta existan en la BD

### El Historial No Aparece
1. Verifica que haya giros registrados
2. Confirma que el sessionId sea válido
3. Revisa la consola del navegador para errores

## 🔧 Configuración Avanzada

### Variables de Entorno
Configura en el frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:5000
```

### Autenticación
El sistema requiere autenticación. Asegúrate de:
1. Estar logueado en la aplicación
2. Tener un token JWT válido
3. Los permisos necesarios en la base de datos

### Personalización
- Los colores y estilos se pueden modificar directamente en `Ruleta.jsx`
- Las animaciones se controlan mediante CSS keyframes
- La duración del giro se puede ajustar en la función `spinRoulette`

## 📊 API Endpoints

### Configuraciones
- `GET /api/roulette/configurations` - Obtener todas las configuraciones
- `POST /api/roulette/configurations` - Crear nueva configuración
- `PUT /api/roulette/configurations/:id` - Actualizar configuración
- `DELETE /api/roulette/configurations/:id` - Eliminar configuración

### Historial
- `POST /api/roulette/spin` - Registrar un giro
- `GET /api/roulette/history/:sessionId` - Obtener historial
- `DELETE /api/roulette/history/:configId` - Eliminar historial

### Estadísticas
- `GET /api/roulette/stats/:sessionId` - Obtener estadísticas
- `POST /api/roulette/reset/:sessionId/:configId` - Resetear estadísticas

¡El sistema está completamente funcional y listo para usar! 🎉
