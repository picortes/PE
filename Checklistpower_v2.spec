# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for Checklist Power v2 - ONE FILE BUILD

from pathlib import Path

if '__file__' in globals():
    BASE_DIR = Path(__file__).resolve().parent
else:
    # En algunos entornos de PyInstaller al ejecutar .spec no existe __file__
    BASE_DIR = Path.cwd().resolve()

a = Analysis(
    [str(BASE_DIR / 'api' / 'app.py')],
    pathex=[str(BASE_DIR)],
    binaries=[],
    datas=[
        (str(BASE_DIR / 'Templates'), 'Templates'),
        (str(BASE_DIR / 'assets'), 'assets'),
        (str(BASE_DIR / 'IMAGENES'), 'IMAGENES'),
    ],
    hiddenimports=[
        'flask',
        'flask_cors',
        'werkzeug.security',
        'pyodbc',
        'reportlab',
        'openpyxl',
        'cryptography',
        'cryptography.x509',
        'cryptography.x509.oid',
        'cryptography.hazmat.primitives',
        'cryptography.hazmat.primitives.asymmetric',
        'cryptography.hazmat.primitives.serialization',
        'cryptography.hazmat.backends',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='PE_V2',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    onefile=True,
)
