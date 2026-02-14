# Spesfidem Aluminio - Sistema de Gestión y Cotización

Este proyecto es una plataforma web para la gestión de clientes, cotizaciones y administración de Spesfidem Aluminio. Incluye una arquitectura híbrida con un frontend dinámico y un backend de persistencia en Python.

## 🚀 Cómo Iniciar el Proyecto

Sigue estos pasos para poner en marcha el sistema en tu computador local.

### 1. Requisitos Previos
*   **Python 3.x** instalado.
*   Navegador web moderno (Chrome, Edge, Firefox).

### 2. Iniciar el Servidor de Persistencia
Abre una terminal en la carpeta raíz del proyecto y ejecuta:

```bash
python3 server.py
```

El servidor se iniciará en el puerto **3000**. Verás un mensaje en la terminal confirmando que el servidor está activo.

### 3. Acceso al Sistema

Existen tres formas de acceder dependiendo de dónde te encuentres:

*   **Acceso Local (Mismo PC)**: 
    Abre en tu navegador: `http://localhost:3000/index.html` (o `admin.html` para el panel de control).
*   **Acceso en Red Local (WiFi de la casa/oficina)**:
    Usa la dirección IP que muestra la terminal al iniciar el servidor (ej: `http://10.6.87.224:3000/admin.html`). Esto permite entrar desde celulares y otras laptops conectadas al mismo WiFi.
*   **Acceso Público (Cualquier lugar/Internet)**:
    Se puede habilitar un túnel temporal con SSH:
    ```bash
    ssh -R 80:localhost:3000 serveo.net
    ```
    Copia el enlace `https://...` que te entregue la terminal para compartirlo con clientes o administradores externos.

---

## 🛠 Estructura del Proyecto

*   `index.html`: Página principal y catálogo.
*   `admin.html`: Panel administrativo (requiere login).
*   `server.py`: Servidor backend Python (maneja datos y seguridad).
*   `js/app.js`: Lógica principal del sistema y conexión con la base de datos.
*   `data/clients.json`: Archivo donde se guardan permanentemente todos los clientes y cotizaciones.

## 🔐 Administración
Para acceder al panel administrativo (`admin.html`), utiliza las credenciales de propietario configuradas en el sistema.

## 📄 Notas de Mantenimiento
*   **Backups**: Se recomienda descargar periódicamente el archivo ZIP generado en la carpeta de Descargas para tener copias de seguridad de las fotos y datos.
*   **Caché**: Si realizas cambios en el código y no se ven reflejados, presiona `Ctrl + Shift + R` para forzar la recarga limpia del navegador.

---
*Desarrollado para Spesfidem Aluminio - Gestión Inteligente.*
