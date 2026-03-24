
import pyodbc
from datetime import datetime

# Config
DB_USER = 'sa'
DB_PASSWORD = 'Coppersink10EMESA'
SERVER = 'EMEBIDWH'
DATABASE = 'Digitalizacion'

conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={DB_USER};PWD={DB_PASSWORD};TrustServerCertificate=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # 1. Get Pedido Info (ID 120 based on screenshot)
    id_pedido = 120
    cursor.execute("SELECT [Nombre_Pauta], [Armario] FROM [Digitalizacion].[PE].[Pedido] WHERE [ID_Pedido] = ?", (id_pedido,))
    row = cursor.fetchone()
    if not row:
        print(f"Pedido {id_pedido} no encontrado")
        exit()
        
    nombre_pauta = row[0]
    armario = row[1]
    print(f"Pedido: {id_pedido}, Armario: {armario}, Pauta en Pedido: '{nombre_pauta}'")
    
    # 2. Run the PDF Query
    sql = """
        SELECT 
            c.[Nombre_Pauta],
            c.[Puesto],
            c.[Id_Control],
            c.[DescripcionControl]
        FROM [Digitalizacion].[PE].[DatosUser] du
        INNER JOIN [Digitalizacion].[PE].[Checklist] c 
            ON c.[Id_Control] = du.[ID_Control]
        INNER JOIN [Digitalizacion].[PE].[Controles] ctrl
            ON ctrl.[Id_Control] = c.[Id_Control]
        WHERE du.[ID_Pedido] = ?
        AND c.[Nombre_Pauta] = ?
        AND ISNULL(ctrl.[VisiblePDF], 1) = 1
        ORDER BY c.[Puesto], c.[Nombre_Pauta], c.[Orden_Pauta]
    """
    
    print("\n--- Ejecutando consulta de PDF ---")
    cursor.execute(sql, (id_pedido, nombre_pauta))
    rows = cursor.fetchall()
    
    print(f"Total filas retornadas: {len(rows)}")
    
    # Analyze distinct Pautas and Controls
    pautas_encontradas = set()
    controles_encontrados = []
    
    for r in rows:
        pautas_encontradas.add(r[0])
        controles_encontrados.append(f"{r[1]} - {r[3]} ({r[0]})")
        
    print(f"Pautas en el resultado: {pautas_encontradas}")
    
    if len(pautas_encontradas) > 1:
        print("⚠️ ALERTA: Se encontraron múltiples pautas en el resultado!")
    else:
        print("✅ Correcto: Solo se encontró la pauta del pedido.")

    # Check for duplicates of same control
    seen = set()
    dupes = []
    for r in rows:
        key = f"{r[2]}-{r[0]}" # ID_Control - Pauta
        if key in seen:
            dupes.append(key)
        seen.add(key)
        
    if dupes:
        print(f"⚠️ Duplicados encontrados (ID_Control-Pauta): {len(dupes)}")
        # print(dupes[:5])

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
