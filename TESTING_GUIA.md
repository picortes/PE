# ✅ GUÍA RÁPIDA - Testing Correcciones

## 🚀 Inicio Rápido

### 1. Verificar Endpoints en Backend
```bash
# Abrir PowerShell o Terminal
cd "\\EMEBIDWH\DIgitalizacion\Checklist Power\api"

# Verificar que los endpoints responden
curl http://localhost:3526/api/correcciones/armarios
curl http://localhost:3526/api/correcciones/armario/1
```

### 2. Verificar Interfaz en Frontend
- Abrir navegador: `https://192.168.253.9:3526`
- Iniciar sesión
- En menú Inicio: debe aparecer nueva tarjeta **"✏️ Correcciones"**

---

## 📋 Checklist de Testing

### A. Cargar Pantalla de Correcciones
- [ ] Clic en tarjeta "Correcciones"
- [ ] Se carga pantalla con título "✏️ Correcciones de Resultados"
- [ ] Dropdown "Selecciona Armario" está vacío (placeholder correcto)
- [ ] Botones en footer "Limpiar Selección" y "Eliminar Seleccionados" visibles

### B. Cargar Armarios
- [ ] Dropdown se llena con armarios
- [ ] Formato: "Armario XXX (ID: YYY)"
- [ ] Ordenados por ID descendente (nuevos primero)
- [ ] Cantidad coincide con SELECT en base de datos

### C. Cargar Controles
- [ ] Seleccionar un armario
- [ ] Tabla aparece con controles
- [ ] Columnas correctas: Checkbox | Puesto | Control | Resultado Actual | Cambiar a | Comentario | Usuario | Fecha
- [ ] Colores de resultados:
  - ✅ OK = Verde (#27ae60)
  - ❌ NOK = Rojo (#e74c3c)
  - ⚪ SIN RESULTADO = Gris (#95a5a6)

### D. Cambiar Resultado
- [ ] Seleccionar "OK" o "NOK" en columna "Cambiar a"
- [ ] (Opcional) Agregar comentario en campo "Comentario"
- [ ] Verificar notificación "Resultado actualizado correctamente"
- [ ] Tabla se recarga automáticamente
- [ ] Nuevo resultado visible en columna "Resultado Actual"
- [ ] Refrescar página: cambio persiste en BD

### E. Seleccionar Múltiples Controles
- [ ] Marcar varios checkboxes individuales
- [ ] Verificar contador en botón "Eliminar Seleccionados"
- [ ] Marcar checkbox "Seleccionar Todo" (header)
- [ ] Todos los checkboxes se marcan
- [ ] Desmarcar checkbox "Seleccionar Todo"
- [ ] Todos los checkboxes se desmarcan

### F. Eliminar Controles
- [ ] Marcar 2-3 controles
- [ ] Clic en "Eliminar Seleccionados"
- [ ] Modal aparece: "⚠️ Confirmar Eliminación"
- [ ] Muestra cantidad correcta de registros
- [ ] Botones: "Cancelar" y "Sí, Eliminar"
- [ ] Clic en "Sí, Eliminar"
- [ ] Notificación: "X registros eliminados correctamente"
- [ ] Tabla se recarga sin los registros eliminados
- [ ] Refrescar página: eliminación persiste en BD

### G. Cancelar Eliminación
- [ ] Marcar controles
- [ ] Clic en "Eliminar Seleccionados"
- [ ] Modal aparece
- [ ] Clic en "Cancelar"
- [ ] Modal desaparece
- [ ] Checkboxes mantienen su estado
- [ ] Tabla no se modifica

### H. Limpiar Selección
- [ ] Marcar varios checkboxes
- [ ] Clic en "Limpiar Selección"
- [ ] Todos los checkboxes se desmarcan
- [ ] Botón "Eliminar Seleccionados" deshabilitado

### I. Validaciones
- [ ] Clic "Eliminar Seleccionados" sin marcar nada → Notificación: "Selecciona al menos un control"
- [ ] Cambiar resultado sin haber seleccionado armario → Tabla no aparece
- [ ] Refrescar página manualmente → Función se recupera correctamente

---

## 🔍 Debugging en Consola

### Abrir DevTools
- Presionar `F12`
- Tab "Console"
- Tab "Network"

### Esperado en Console
```
✅ X armarios cargados
✅ X controles cargados para armario Armario 001
✅ Resultado actualizado: OK
✅ X registros eliminados
```

### Esperado en Network
```
GET /api/correcciones/armarios
GET /api/correcciones/armario/1
POST /api/correcciones/actualizar-resultado/1/101
POST /api/correcciones/eliminar
```

---

## 🗄️ Verificación en Base de Datos

### Verificar Cambio de Resultado
```sql
SELECT TOP 5 
    ID_DatosUser, ID_Pedido, ID_Control, 
    Resultado, FechaRegistro, Comentario, User
FROM [Digitalizacion].[PE].[DatosUser]
ORDER BY FechaRegistro DESC
```

Esperar: Registro con User='CORRECCIONES', FechaRegistro = ahora

### Verificar Eliminación
```sql
SELECT COUNT(*) 
FROM [Digitalizacion].[PE].[DatosUser]
WHERE ID_Pedido = 1 AND ID_Control IN (101, 102, 103)
```

Esperar: 0 registros

---

## 📊 Casos de Uso Especiales

### Caso 1: Sin resultados previos
- Seleccionar armario
- Control muestra "SIN RESULTADO"
- Cambiar a "OK" desde dropdown
- Crea nuevo registro en DatosUser ✅

### Caso 2: Múltiples pautas
- Armario con controles de varias pautas
- Cada pauta se mezcla en tabla
- Orden por Puesto (como en backend)
- Todos funcionan correctamente ✅

### Caso 3: Usuario desconocido
- Control sin usuario asignado
- Columna "Usuario" muestra "N/A"
- Puede cambiar/eliminar sin problemas ✅

---

## ⚠️ Errores Comunes

### "Error de conexión a base de datos"
- [ ] Verificar ConexionODBC en app.py
- [ ] Verificar credenciales de SQL Server
- [ ] Verificar tabla PE.Pedido existe
- [ ] Verificar tabla PE.DatosUser existe

### Dropdown vacío
- [ ] Verificar tabla PE.Pedido tiene registros
- [ ] Verificar columna "Armario" no está NULL
- [ ] Ejecutar SELECT de armarios en SQL Server

### Tabla de controles no aparece
- [ ] Verificar tabla PE.Controles tiene registros
- [ ] Verificar Nombre_Pauta coincide en ambas tablas
- [ ] Ver logs del servidor para detalles

### Cambio no persiste
- [ ] Verificar commit() en endpoint
- [ ] Verificar ConexionODBC cierra correctamente
- [ ] Refrescar página después de cambio

---

## 🔄 Logs del Servidor

### Esperado al cargar armarios
```
🔍 Obteniendo lista de armarios para correcciones...
📊 5 armarios obtenidos
```

### Esperado al cargar controles
```
🔍 Obteniendo controles del armario ID_Pedido: 1
✅ 12 controles obtenidos para armario Armario 001
```

### Esperado al cambiar resultado
```
📝 Actualizando resultado - ID_Pedido: 1, ID_Control: 101, Resultado: OK
✅ Resultado actualizado correctamente
```

### Esperado al eliminar
```
🗑️ Eliminando controles - ID_Pedido: 1, Controles: [101, 102]
   ✅ Eliminado registro: Pedido 1 - Control 101
   ✅ Eliminado registro: Pedido 1 - Control 102
✅ 2 registros eliminados
```

---

## 📝 Registro de Testing

| Fecha | Tester | Prueba | Estado | Notas |
|-------|--------|--------|--------|-------|
| 2025-12-19 | - | Armarios | ⏳ Pendiente | |
| | | Controles | ⏳ Pendiente | |
| | | Cambio Resultado | ⏳ Pendiente | |
| | | Eliminación | ⏳ Pendiente | |

---

## 📞 Soporte

Si hay problemas:

1. **Revisar logs del servidor** (console del backend)
2. **Abrir DevTools** (F12) → Console → Network
3. **Verificar base de datos** con queries SQL
4. **Verificar conexión** a servidor HTTPS

---

**Última actualización**: 2025-12-19  
**Versión**: 1.0  
**Status**: 🟢 Ready for Testing
