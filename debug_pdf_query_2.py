
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
    print(f"Pedido: {id_pedido}, Pauta: '{nombre_pauta}'")
    
    # 2. Run the PDF Query
    sql = """
        SELECT 
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
    """

    cursor.execute(sql, (id_pedido, nombre_pauta))
    rows = cursor.fetchall()
    
    print(f"Total filas: {len(rows)}")
    
    # Check duplicates
    control_counts = {}
    for r in rows:
        id_ctrl = r[0]
        if id_ctrl not in control_counts:
            control_counts[id_ctrl] = 0
        control_counts[id_ctrl] += 1
        
    dups = {k:v for k,v in control_counts.items() if v > 1}
    if dups:
        print(f"⚠️ Controles duplicados: {dups}")
        for k in list(dups.keys())[:3]:
             print(f"   Control {k} aparece {dups[k]} veces")
    else:
        print("✅ No hay duplicados de controles.")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
