# Plan de Testing - Refactorización [PE].[Controles]

## Resumen de Cambios
Se ha refactorizado la capa de acceso a base de datos para migrara de un modelo denormalizado a un modelo relacional normalizado. La columna `Puesto` (string) ha sido reemplazada por una relación FK a la tabla `PE.Puesto`.

**Total de endpoints afectados:** 10+
**Cambios en queries:** 13 queries corregidas
**Estado:** ✅ COMPLETO

---

## Matriz de Testing

### 1. Endpoints CRUD Básicos

#### Test 1.1: Crear Control
```
POST /api/save-controles
Content-Type: application/json

{
  "id_puesto": 1,
  "punto_inspeccion": "Punto de prueba",
  "proceso": "Proceso test",
  "carac_inspeccion": "Característica",
  "tipo_reg": "Tipo",
  "descripcion_control": "Descripción test",
  "metodo": "Método",
  "ruta_foto": ""
}

Esperar: 
- Status 201/200
- Response: { "success": true, "id_control": <nuevo_id> }
- DB: Control creado en [PE].[Controles] con ID_Puesto=1
```

**Cambio:** Parámetro ahora es `id_puesto` (int), no `puesto` (string)

---

#### Test 1.2: Obtener Controles Existentes
```
GET /api/get-controles-existentes

Esperar:
- Status 200
- Response incluye lista de controles con ambos campos:
  {
    "controles": [
      {
        "Id_Control": 1,
        "ID_Puesto": 1,
        "Nombre_Puesto": "Puesto A",
        "PuntoInspección": "...",
        ...
      }
    ]
  }
- Verificar: Nombre_Puesto viene de JOIN con PE.Puesto
```

**Cambio:** Query ahora usa INNER JOIN con PE.Puesto

---

#### Test 1.3: Actualizar Control
```
PUT /api/update-control/1
Content-Type: application/json

{
  "id_puesto": 2,
  "punto_inspeccion": "Punto actualizado",
  "descripcion_control": "Descripción actualizada",
  ...
}

Esperar:
- Status 200
- Response: { "success": true }
- DB: Control con Id_Control=1 ahora tiene ID_Puesto=2
```

**Cambio:** Parámetro es `id_puesto` (int); UPDATE usa WHERE Id_Control

---

#### Test 1.4: Eliminar Control
```
DELETE /api/delete-control/1

Esperar:
- Status 200
- Response: { "success": true }
- Logs: Mostrar "Puesto: Puesto A" (obtenido de JOIN con PE.Puesto)
- DB: Control eliminado
```

**Cambio:** DELETE obtiene Nombre_Puesto mediante JOIN para logging

---

### 2. Endpoints de Lectura Relacionados

#### Test 2.1: Obtener Pautas con Controles
```
GET /api/get-pautas

Esperar:
- Status 200
- Response:
  {
    "pautas": [
      {
        "id_pauta": 1,
        "nombre_pauta": "Pauta 1",
        "controles": [
          {
            "id_control": 1,
            "id_puesto": 1,
            "puesto": "Puesto A",
            "punto_inspeccion": "...",
            ...
          }
        ]
      }
    ]
  }
- Verificar: Campo "puesto" viene de JOIN con PE.Puesto (no de Controles)
```

**Cambio:** SELECT y ORDER BY usan PE.Puesto JOIN

---

#### Test 2.2: Obtener Controles del Armario
```
GET /api/get-controles-armario/1  (ID_Pedido=1)

Esperar:
- Status 200
- Response incluye controles con campo "Nombre_Puesto"
- Verificación: En logs, debe mostrar que se obtiene Nombre_Puesto de PE.Puesto
```

**Cambio:** SELECT y ORDER BY usan PE.Puesto JOIN

---

### 3. Endpoints de Validación

#### Test 3.1: Validar Pautas Compartibles
```
PUT /api/control/can-be-shared/PuestoA

Esperar:
- Status 200
- Response: { "success": true, "compartible": true/false, "pautas": [...] }
- Verificación interna: Lookup de Nombre_Puesto → ID_Puesto funciona
```

**Cambio:** Lookup de ID_Puesto + WHERE usa ID_Puesto

---

#### Test 3.2: Puesto Compartido - Obtener Pautas Filtradas
```
PUT /api/puesto/PuestoA/compartido
Content-Type: application/json

{
  "compartido": true
}

Esperar:
- Status 200
- Verificación: Query de validación usa ID_Puesto correctamente
```

**Cambio:** Validación query ahora busca por ID_Puesto

---

### 4. Integración End-to-End

#### Test 4.1: Flujo Completo - Crear y Leer
```
1. POST /api/save-controles con id_puesto=1
   └─ Obtener nuevo Id_Control (ej: 42)

2. GET /api/get-controles-existentes
   └─ Verificar que Id_Control=42 aparece en lista
   └─ Verificar que ID_Puesto=1 y Nombre_Puesto="Puesto A" están presentes

3. GET /api/get-pautas
   └─ Verificar que control aparece con id_puesto=1 y puesto="Puesto A"
```

---

#### Test 4.2: Flujo Completo - Actualizar y Verificar
```
1. PUT /api/update-control/42 con id_puesto=2
   └─ Status 200

2. GET /api/get-controles-existentes
   └─ Control 42 debe mostrar ID_Puesto=2 y Nombre_Puesto="Puesto B"

3. GET /api/get-pautas
   └─ Control 42 debe mostrar puesto="Puesto B"
```

---

#### Test 4.3: Flujo Completo - Eliminar y Verificar Logs
```
1. DELETE /api/delete-control/42
   └─ Status 200
   └─ Logs incluyen nombre del puesto (obtenido de PE.Puesto)

2. GET /api/get-controles-existentes
   └─ Control 42 no debe aparecer en lista
```

---

### 5. Test de Error Handling

#### Test 5.1: Puesto Inválido
```
PUT /api/validation/check-shared-pautas?puesto=InvalidPuesto

Esperar:
- Status 404
- Response: { "success": false, "message": "Puesto 'InvalidPuesto' no encontrado" }
- Verificación: Lookup de ID_Puesto retorna NULL correctamente
```

**Cambio Importante:** Ahora valida que el puesto existe en PE.Puesto antes de usar

---

#### Test 5.2: ID_Puesto Inválido en Save
```
POST /api/save-controles con id_puesto=999 (que no existe)

Esperar:
- Status 400/500
- Response: Error de FK constraint
- Verificación: Base de datos rechaza ID_Puesto inválido
```

---

#### Test 5.3: Control No Encontrado
```
DELETE /api/delete-control/99999

Esperar:
- Status 404
- Response: { "success": false, "message": "Control no encontrado" }
```

---

### 6. Validación de Compatibilidad con Otras Tablas

#### Test 6.1: [PE].[Checklist] No Afectada
```
Verificar que [PE].[Checklist] sigue funcionando normalmente:
- Tabla tiene columna Puesto (string)
- Queries que usan [PE].[Checklist] no fueron modificadas
- Referencias a c.[Puesto] en [Checklist] son correctas y funcionales

GET /api/generate-pdf/<id_pedido>
└─ Debe generar PDF sin errores
└─ PDF debe incluir nombres de puestos (obtenidos de [Checklist])
```

---

#### Test 6.2: [PE].[DatosUser] Funcionando
```
Verificar que [PE].[DatosUser] sigue funcionando:
GET /api/get-controles-armario/<id_pedido>
└─ Status 200
└─ Incluye datos de DatosUser correctamente
└─ Nombre_Puesto viene de JOIN con PE.Puesto
```

---

## Checklist de Validación

### Fase 1: Configuración
- [ ] Base de datos actualizada con nueva estructura
- [ ] [PE].[Puesto] contiene todos los puestos
- [ ] [PE].[Controles] tiene ID_Puesto como FK
- [ ] Índices creados en [PE].[Controles].[ID_Puesto]

### Fase 2: Unitarios
- [ ] Test 1.1 - Create Control
- [ ] Test 1.2 - Get Controls
- [ ] Test 1.3 - Update Control
- [ ] Test 1.4 - Delete Control

### Fase 3: Integridad
- [ ] Test 2.1 - Get Pautas
- [ ] Test 2.2 - Get Armario Controls
- [ ] Test 3.1 - Shared Validation
- [ ] Test 3.2 - Puesto Compartido

### Fase 4: End-to-End
- [ ] Test 4.1 - Create → Read Flow
- [ ] Test 4.2 - Update → Verify Flow
- [ ] Test 4.3 - Delete → Verify Flow

### Fase 5: Error Handling
- [ ] Test 5.1 - Invalid Puesto
- [ ] Test 5.2 - Invalid ID_Puesto
- [ ] Test 5.3 - Control Not Found

### Fase 6: Compatibilidad
- [ ] Test 6.1 - [PE].[Checklist] Unaffected
- [ ] Test 6.2 - [PE].[DatosUser] Working

### Fase 7: Performance
- [ ] [ ] Tiempos de query < 500ms
- [ ] [ ] Índices funcionan correctamente
- [ ] [ ] No hay N+1 queries

---

## Notas Importantes

1. **Frontend debe actualizar:**
   - `POST /api/save-controles`: Cambiar `puesto` → `id_puesto`
   - `PUT /api/update-control`: Cambiar `puesto` → `id_puesto`
   - Response parsing: Ahora hay campos `ID_Puesto` y `Nombre_Puesto`

2. **Base de Datos debe tener:**
   - Tabla PE.Puesto con al menos un registro para cada puesto
   - Indices en [PE].[Controles].[ID_Puesto]
   - FK constraint de [PE].[Controles].[ID_Puesto] → [PE].[Puesto].[ID_Puesto]

3. **Logs y Debugging:**
   - Logs ahora incluyen Nombre_Puesto (obtenido de PE.Puesto)
   - Error messages mejorados para validaciones de puesto

4. **Rollback (si es necesario):**
   - Revertir cambios en app.py a versión anterior
   - Restaurar PE.Controles con columna Puesto
   - Restaurar PE.Pautas con columna Puesto

---

## Comando para Verificar Cambios en BD

```sql
-- Verificar estructura de PE.Controles
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Controles' AND TABLE_SCHEMA = 'PE'
ORDER BY ORDINAL_POSITION

-- Debe mostrar: ID_Puesto (int), NO debe mostrar: Puesto (nvarchar)

-- Verificar FK
SELECT CONSTRAINT_NAME, TABLE_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'Controles' AND TABLE_SCHEMA = 'PE'

-- Debe haber: FK desde ID_Puesto a PE.Puesto.ID_Puesto
```

---

**Documento creado:** 2024
**Estado de Testing:** 🔄 LISTO PARA COMENZAR
**Duración estimada:** 1-2 horas para suite completa
