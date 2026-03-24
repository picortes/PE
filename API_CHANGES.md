# Cambios de API - Refactorización [PE].[Controles]

## Resumen Ejecutivo
Se ha refactorizado la arquitectura de base de datos de [PE].[Controles] para usar un modelo relacional normalizado. Esto requiere cambios en cómo el frontend envía y recibe datos.

**Impacto:** 3 endpoints requieren cambios en sus payloads
**Compatibilidad:** Respuestas JSON aún incluyen `puesto` para backwards compatibility

---

## 1. POST /api/save-controles (Crear Control)

### ⚠️ CAMBIO CRÍTICO - PARÁMETRO MODIFICADO

#### ANTES (❌ Deprecated)
```http
POST /api/save-controles
Content-Type: application/json

{
  "puesto": "Puesto A",
  "punto_inspeccion": "Punto 1",
  "proceso": "Proceso X",
  "carac_inspeccion": "Característica Y",
  "tipo_reg": "Tipo Z",
  "descripcion_control": "Descripción...",
  "metodo": "Método...",
  "ruta_foto": ""
}
```

Response:
```json
{
  "success": true,
  "id_control": 42,
  "message": "Control guardado exitosamente"
}
```

---

#### DESPUÉS (✅ Nuevo)
```http
POST /api/save-controles
Content-Type: application/json

{
  "id_puesto": 1,
  "punto_inspeccion": "Punto 1",
  "proceso": "Proceso X",
  "carac_inspeccion": "Característica Y",
  "tipo_reg": "Tipo Z",
  "descripcion_control": "Descripción...",
  "metodo": "Método...",
  "ruta_foto": ""
}
```

Response:
```json
{
  "success": true,
  "id_control": 42,
  "message": "Control guardado exitosamente"
}
```

---

### Cambios de Implementación

**Cliente JavaScript (antes):**
```javascript
const data = {
  puesto: selectedPuesto.nombre,  // ❌ String - nombre del puesto
  punto_inspeccion: form.punto_inspeccion,
  ...
};
```

**Cliente JavaScript (después):**
```javascript
const data = {
  id_puesto: selectedPuesto.id,  // ✅ Integer - ID del puesto
  punto_inspeccion: form.punto_inspeccion,
  ...
};
```

---

### Cómo Obtener ID_Puesto

**Opción 1: Desde GET /api/get-controles-existentes**
```javascript
// En la respuesta ahora viene ID_Puesto
fetch('/api/get-controles-existentes')
  .then(r => r.json())
  .then(data => {
    data.controles.forEach(control => {
      console.log(`Puesto: ${control.Nombre_Puesto}, ID: ${control.ID_Puesto}`);
    });
  });
```

**Opción 2: Desde un dropdown configurado**
```javascript
// Si tienes un dropdown de puestos, debes incluir el ID
const puestosDropdown = [
  { id: 1, nombre: "Puesto A" },
  { id: 2, nombre: "Puesto B" },
  { id: 3, nombre: "Puesto C" }
];

// Al guardar, usar: puestosDropdown[selectedIndex].id
```

---

## 2. PUT /api/update-control/<control_id> (Actualizar Control)

### ⚠️ CAMBIO CRÍTICO - PARÁMETRO MODIFICADO

#### ANTES (❌ Deprecated)
```http
PUT /api/update-control/42
Content-Type: application/json

{
  "puesto": "Puesto B",
  "punto_inspeccion": "Punto actualizado",
  "descripcion_control": "Nueva descripción",
  ...
}
```

Response:
```json
{
  "success": true,
  "message": "Control actualizado exitosamente"
}
```

---

#### DESPUÉS (✅ Nuevo)
```http
PUT /api/update-control/42
Content-Type: application/json

{
  "id_puesto": 2,
  "punto_inspeccion": "Punto actualizado",
  "descripcion_control": "Nueva descripción",
  ...
}
```

Response:
```json
{
  "success": true,
  "message": "Control actualizado exitosamente"
}
```

---

### Cambios de Implementación

**Cliente JavaScript (antes):**
```javascript
fetch(`/api/update-control/${controlId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    puesto: newPuesto.nombre,  // ❌ String
    punto_inspeccion: newForm.punto_inspeccion,
    ...
  })
});
```

**Cliente JavaScript (después):**
```javascript
fetch(`/api/update-control/${controlId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_puesto: newPuesto.id,  // ✅ Integer
    punto_inspeccion: newForm.punto_inspeccion,
    ...
  })
});
```

---

## 3. GET /api/get-controles-existentes (Obtener Controles)

### ✅ COMPATIBLE - PERO RESPUESTA EXTENDIDA

#### ANTES (Aún funciona)
```http
GET /api/get-controles-existentes

Response:
{
  "success": true,
  "controles": [
    {
      "Id_Control": 42,
      "Puesto": "Puesto A",
      "PuntoInspección": "Punto 1",
      "Proceso": "Proceso X",
      ...
    }
  ]
}
```

---

#### DESPUÉS (Extendido)
```http
GET /api/get-controles-existentes

Response:
{
  "success": true,
  "controles": [
    {
      "Id_Control": 42,
      "ID_Puesto": 1,                    // ✅ NUEVO - ID entero
      "Nombre_Puesto": "Puesto A",       // ✅ NUEVO - Nombre del puesto
      "PuntoInspección": "Punto 1",
      "Proceso": "Proceso X",
      "CaracInspeccion": "Característica Y",
      "TipoReg": "Tipo Z",
      "DescripcionControl": "Descripción...",
      "Metodo": "Método...",
      "Ruta_foto_mostrar": "",
      "VisiblePDF": 1
    }
  ]
}
```

---

### Cambios de Implementación

**Cliente JavaScript (compatible):**
```javascript
// Código antiguo sigue funcionando pero puede mejorar
fetch('/api/get-controles-existentes')
  .then(r => r.json())
  .then(data => {
    data.controles.forEach(control => {
      // ✅ Ahora puedes usar ID_Puesto directamente
      console.log(`Control ${control.Id_Control}: Puesto ID=${control.ID_Puesto}`);
    });
  });
```

**Cliente JavaScript (recomendado):**
```javascript
// Nuevo: usar ID_Puesto en lugar de Nombre_Puesto para operaciones
fetch('/api/get-controles-existentes')
  .then(r => r.json())
  .then(data => {
    data.controles.forEach(control => {
      // Usar campos nuevos para mayor precisión
      const controlData = {
        id: control.Id_Control,
        idPuesto: control.ID_Puesto,     // ✅ ID del puesto
        nombrePuesto: control.Nombre_Puesto,  // ✅ Nombre para mostrar
        descripcion: control.DescripcionControl,
        ...
      };
      mostrarEnTabla(controlData);
    });
  });
```

---

## 4. GET /api/get-pautas (Obtener Pautas)

### ✅ COMPATIBLE - RESPUESTA EXTENDIDA

#### ANTES
```http
GET /api/get-pautas

Response:
{
  "success": true,
  "pautas": [
    {
      "id_pauta": 1,
      "nombre_pauta": "Pauta 1",
      "controles": [
        {
          "id_control": 42,
          "puesto": "Puesto A",
          "punto_inspeccion": "Punto 1",
          ...
        }
      ]
    }
  ]
}
```

---

#### DESPUÉS
```http
GET /api/get-pautas

Response:
{
  "success": true,
  "pautas": [
    {
      "id_pauta": 1,
      "nombre_pauta": "Pauta 1",
      "controles": [
        {
          "id_control": 42,
          "id_puesto": 1,            // ✅ NUEVO - ID entero
          "puesto": "Puesto A",      // ✅ Aún presente para compatibilidad
          "punto_inspeccion": "Punto 1",
          "tipo_reg": "Tipo Z",
          "descripcionControl": "Descripción...",
          "orden": 1
        }
      ]
    }
  ]
}
```

---

## 5. Otros Endpoints (Sin cambios en contrato)

Los siguientes endpoints **NO requieren cambios en cliente**:

- ✅ `DELETE /api/delete-control/<id>` - Sin cambios
- ✅ `PUT /api/puesto/<nombre>/compartido` - Sin cambios en request
- ✅ `GET /api/get-controles-armario/<id_pedido>` - Sin cambios en request

---

## Guía de Migración

### Paso 1: Identificar dónde se envía `puesto` como string

**Buscar en código:**
```javascript
// ❌ Buscar esto:
data.puesto = "Nombre del puesto"
{puesto: "..."}
formData.puesto
```

### Paso 2: Obtener ID del puesto

**Opción A: Desde un dropdown/select**
```javascript
const selectElement = document.getElementById('puesto-select');
const idPuesto = selectElement.options[selectElement.selectedIndex].value;
data.id_puesto = parseInt(idPuesto);
```

**Opción B: Desde una búsqueda**
```javascript
// Primero obtener lista de puestos con IDs
const puestosResponse = await fetch('/api/get-controles-existentes');
const puestosData = await puestosResponse.json();

// Buscar el ID del puesto por nombre
const nombrePuesto = "Puesto A";
const idPuesto = puestosData.controles
  .find(c => c.Nombre_Puesto === nombrePuesto)?.ID_Puesto;

if (idPuesto) {
  data.id_puesto = idPuesto;
}
```

### Paso 3: Actualizar envío de datos

```javascript
// ANTES
const response = await fetch('/api/save-controles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    puesto: selectedPuesto,  // ❌
    punto_inspeccion: form.punto_inspeccion,
    ...
  })
});

// DESPUÉS
const response = await fetch('/api/save-controles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_puesto: parseInt(selectedPuestoId),  // ✅
    punto_inspeccion: form.punto_inspeccion,
    ...
  })
});
```

### Paso 4: Actualizar parseo de respuestas

```javascript
// ANTES
response.controles.forEach(control => {
  console.log(control.Puesto);  // String
});

// DESPUÉS - Usar ambos campos ahora disponibles
response.controles.forEach(control => {
  console.log(`ID: ${control.ID_Puesto}, Nombre: ${control.Nombre_Puesto}`);
});
```

---

## Errores Comunes y Soluciones

### Error 1: "Bad Request" al crear control
```
POST /api/save-controles
Body: {"puesto": "Puesto A", ...}

Error: 400 Bad Request
Causa: Parámetro debe ser "id_puesto" (int), no "puesto" (string)

Solución:
{
  "id_puesto": 1,  // ✅ Cambiar aquí
  ...
}
```

---

### Error 2: FK Constraint Violation
```
Error: Foreign key constraint "FK_Controles_Puesto" violation
Causa: ID_Puesto enviado no existe en PE.Puesto

Solución:
1. Verificar que ID_Puesto existe en PE.Puesto
2. Usar GET /api/get-controles-existentes para validar IDs
```

---

### Error 3: Respuesta tiene campos inesperados
```
Error: Cannot read property 'puesto' of undefined
Causa: Código espera "puesto" pero ahora hay "Nombre_Puesto"

Solución:
// Actualizar referencias
data.Nombre_Puesto  // Usar esto para mostrar
data.ID_Puesto      // Usar esto para operaciones CRUD
```

---

## Checklist de Actualización

### Frontend
- [ ] Actualizar lógica de `POST /api/save-controles` para usar `id_puesto`
- [ ] Actualizar lógica de `PUT /api/update-control` para usar `id_puesto`
- [ ] Validar que IDs de puesto se obtienen de `GET /api/get-controles-existentes`
- [ ] Actualizar referencias de `Puesto` a `Nombre_Puesto` donde sea necesario
- [ ] Probar crear control - debe asignar a puesto correcto
- [ ] Probar actualizar control - debe cambiar puesto correctamente
- [ ] Probar obtener controles - debe mostrar ambos ID y nombre

### Backend (app.py)
- [ ] ✅ Cambio en `save_controles` - COMPLETADO
- [ ] ✅ Cambio en `update_control` - COMPLETADO
- [ ] ✅ Cambio en `get_controles_existentes` - COMPLETADO
- [ ] ✅ Cambio en `delete_control` - COMPLETADO
- [ ] ✅ Cambio en `actualizar_puesto_compartido` - COMPLETADO
- [ ] ✅ Cambio en `get_pautas` - COMPLETADO

### Base de Datos
- [ ] ✅ Tabla PE.Puesto existe con ID_Puesto
- [ ] ✅ PE.Controles tiene FK a PE.Puesto
- [ ] ✅ Índice en PE.Controles.ID_Puesto creado
- [ ] ✅ Datos migrados correctamente

---

## Preguntas Frecuentes

**P: ¿Se puede usar aún el nombre del puesto?**
A: Solo para lectura. Las respuestas JSON incluyen `Nombre_Puesto`, pero para crear/actualizar debes usar `ID_Puesto` (entero).

**P: ¿Mi código antiguo se romperá?**
A: Parcialmente. Si intentas crear/actualizar controles con `puesto: "string"`, fallará. Las lecturas funcionarán pero con campos adicionales.

**P: ¿Cómo obtengo una lista de Puestos con IDs?**
A: Usa `GET /api/get-controles-existentes` - la respuesta incluye todos los puestos usados con sus IDs. O consulta directamente `SELECT ID_Puesto, Nombre_Puesto FROM [PE].[Puesto]` en DB.

**P: ¿Hay un endpoint para obtener todos los puestos?**
A: No específicamente, pero puedes deducirlos de `/api/get-controles-existentes` o consultar DB directamente.

**P: ¿Qué sucede si intento usar un ID_Puesto que no existe?**
A: Error de Foreign Key Constraint. La BD lo rechazará.

---

## Timeline

- **Semana 1:** Backend refactorizado ✅ COMPLETADO
- **Semana 2:** Frontend actualización (necesario)
- **Semana 3:** Testing integrado
- **Semana 4:** Deployment

---

**Documento generado:** 2024
**Estado:** 🔄 LISTO PARA IMPLEMENTACIÓN EN FRONTEND
**Contacto para dudas:** [equipo de backend]
