# FotosBoda • Drive Uploader

Aplicación web moderna y responsive para que los invitados de una boda o evento suban fotos y videos directamente a una carpeta compartida de Google Drive, **sin necesidad de iniciar sesión ni otorgar permisos complicados**.

## 🚀 Características

- **Cero permisos para invitados:** Los asistentes no necesitan ingresar su cuenta ni autorizar accesos.
- **Soporte móvil completo:** Botón directo para tomar fotos/grabar videos con la cámara del celular o seleccionar desde la galería.
- **Arrastrar y soltar:** Zona interactiva con vista previa de imágenes y videos seleccionados.
- **Dedicatorias:** Campo opcional para que los invitados dejen un mensaje o su nombre con cada tanda de fotos.
- **Código QR imprimible:** Generador de código QR para imprimir y colocar en mesas o en la recepción del evento.
- **Subida directa a Google Drive:** Conectado mediante Google Apps Script a la carpeta pública compartida.
- **Animaciones festivas:** Confeti con `canvas-confetti` al completar la subida.

## 📁 Estructura del Proyecto

```text
├── index.html                  # Punto de entrada HTML
├── package.json                # Dependencias y scripts
├── vite.config.ts              # Configuración de Vite y Tailwind
├── tsconfig.json               # Configuración de TypeScript
├── public/                     # Archivos estáticos y código fuente descargable
└── src/
    ├── main.tsx                # Montaje de React 19
    ├── index.css               # Estilos globales con Tailwind CSS
    ├── App.tsx                 # Componente orquestador principal
    ├── types/
    │   └── index.ts            # Interfaces y contratos de datos
    ├── lib/
    │   ├── drive.ts            # Comunicación con Google Apps Script y Drive
    │   └── auth.ts             # Configuración de Firebase y Google OAuth
    └── components/
        ├── Navbar.tsx          # Barra superior con accesos directos
        ├── FolderInfoCard.tsx  # Información de la carpeta compartida de Drive
        ├── UploadZone.tsx      # Zona de carga y selección de fotos
        ├── UploadQueue.tsx     # Barras de progreso y estado en tiempo real
        ├── UploadedHistory.tsx # Galería de archivos subidos en la sesión
        ├── QRCodeModal.tsx     # Modal con código QR para descargar/imprimir
        └── GoogleSignInButton.tsx
```

## 🛠️ Instalación y Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Compilar para producción:
   ```bash
   npm run build
   ```

## ☁️ Google Apps Script (Webhook)

El script alojado en `script.google.com` que recibe las fotos y las guarda en Drive:

```javascript
function doGet(e) {
  return ContentService.createTextOutput("Servidor activo y listo para recibir fotos.");
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folder = DriveApp.getFolderById("1sVqUqu_EhisG0LYacjsUOL1zwn6mjPyH");
    var decoded = Utilities.base64Decode(data.base64);
    var blob = Utilities.newBlob(decoded, data.mimeType, data.name);
    var file = folder.createFile(blob);
    if (data.dedication) {
      file.setDescription("Subido por: " + data.dedication);
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```
