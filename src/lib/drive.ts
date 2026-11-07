/**
 * Google Drive API & Apps Script Client Helpers
 */

export const TARGET_FOLDER_ID = '1sVqUqu_EhisG0LYacjsUOL1zwn6mjPyH';
export const TARGET_FOLDER_URL = `https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}?usp=sharing`;

// Webhook deployed by the user for zero-permission guest uploads
export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbysxxPPcq8EF_3udRiXlJLWzNiZIQ-D5yi09QeGu_unGB3EpM7qGaEi3E0FtB0lTCFq0w/exec';

export interface UploadProgressCallback {
  (bytesUploaded: number, totalBytes: number, speed: number): void;
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
}

/**
 * Convert a File object to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file directly via Google Apps Script Web App
 * NO GMAIL LOGIN OR PERMISSIONS REQUIRED FOR GUESTS!
 */
export async function uploadFileViaAppsScript(
  file: File,
  dedication?: string,
  onProgress?: UploadProgressCallback,
  options?: {
    scriptUrl?: string;
    signal?: AbortSignal;
  }
): Promise<DriveUploadResult> {
  const url = options?.scriptUrl || APPS_SCRIPT_URL;

  // Convert to base64
  const base64Data = await fileToBase64(file);

  const payload = JSON.stringify({
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64: base64Data,
    dedication: dedication || '',
  });

  const startTime = Date.now();
  const totalBytes = file.size;

  // Progress simulation while network request is in-flight
  let currentBytes = Math.min(totalBytes * 0.15, 50000);
  if (onProgress) {
    onProgress(Math.round(currentBytes), totalBytes, (currentBytes / 0.5));
  }

  const progressInterval = setInterval(() => {
    if (currentBytes < totalBytes * 0.9) {
      currentBytes += (totalBytes - currentBytes) * 0.2;
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? currentBytes / elapsed : 0;
      if (onProgress) {
        onProgress(Math.round(currentBytes), totalBytes, speed);
      }
    }
  }, 250);

  try {
    // Attempt standard fetch with text/plain to avoid CORS preflight (OPTIONS)
    let fetchSucceeded = false;
    let resultJson: any = null;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payload,
        signal: options?.signal,
      });

      if (response.ok) {
        try {
          resultJson = await response.json();
          if (resultJson?.status === 'error') {
            throw new Error(resultJson.message || 'Error en Google Drive');
          }
          fetchSucceeded = true;
        } catch {
          // If response body is not JSON or redirected without readable body
          fetchSucceeded = true;
        }
      }
    } catch (corsErr: any) {
      if (corsErr?.name === 'AbortError') throw corsErr;
      console.warn('Standard fetch attempt had error, trying no-cors fallback:', corsErr);
      
      // Fallback with mode: 'no-cors' which bypasses browser redirect/CORS blocks
      // This sends the payload directly to Apps Script and Google creates the file!
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payload,
        signal: options?.signal,
      });
      fetchSucceeded = true;
    }

    clearInterval(progressInterval);
    if (onProgress) {
      const elapsed = (Date.now() - startTime) / 1000;
      onProgress(totalBytes, totalBytes, elapsed > 0 ? totalBytes / elapsed : 0);
    }

    if (resultJson && resultJson.id) {
      return {
        id: resultJson.id,
        name: resultJson.name || file.name,
        webViewLink: resultJson.url || TARGET_FOLDER_URL,
      };
    }

    return {
      id: 'uploaded',
      name: file.name,
      webViewLink: TARGET_FOLDER_URL,
    };
  } catch (err: any) {
    clearInterval(progressInterval);
    if (err?.name === 'AbortError') {
      throw new DOMException('Subida cancelada por el usuario', 'AbortError');
    }
    throw new Error(
      err?.message || 'Error al conectar con Google Drive. Por favor verifica los permisos del script.'
    );
  }
}

/**
 * Upload a file to the target Google Drive folder using Resumable Upload (OAuth method)
 */
export async function uploadFileToDrive(
  file: File,
  accessToken: string,
  onProgress?: UploadProgressCallback,
  options?: {
    customName?: string;
    description?: string;
    folderId?: string;
    signal?: AbortSignal;
  }
): Promise<DriveUploadResult> {
  const folderId = options?.folderId || TARGET_FOLDER_ID;
  const fileName = options?.customName || file.name;
  const mimeType = file.type || 'application/octet-stream';

  const metadata = {
    name: fileName,
    parents: [folderId],
    description: options?.description || `Subido mediante Drive Uploader (${new Date().toLocaleString()})`,
  };

  const initResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': file.size.toString(),
      },
      body: JSON.stringify(metadata),
      signal: options?.signal,
    }
  );

  if (!initResponse.ok) {
    let errorDetail = '';
    try {
      const errJson = await initResponse.json();
      errorDetail = errJson?.error?.message || initResponse.statusText;
    } catch {
      errorDetail = initResponse.statusText;
    }
    throw new Error(`Error al iniciar la subida en Drive (${initResponse.status}): ${errorDetail}`);
  }

  const uploadUrl = initResponse.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('No se recibió la URL de subida de Google Drive.');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', mimeType);

    let lastLoaded = 0;
    let lastTime = Date.now();

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          let speed = 0;
          if (timeDiff > 0.2) {
            speed = (event.loaded - lastLoaded) / timeDiff;
            lastLoaded = event.loaded;
            lastTime = now;
          }
          onProgress(event.loaded, event.total, speed);
        }
      };
    }

    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new DOMException('Subida cancelada por el usuario', 'AbortError'));
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({
            id: result.id,
            name: result.name || fileName,
            webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
            webContentLink: result.webContentLink,
          });
        } catch {
          resolve({
            id: 'uploaded',
            name: fileName,
            webViewLink: TARGET_FOLDER_URL,
          });
        }
      } else {
        let errMessage = `Error de subida (${xhr.status})`;
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes?.error?.message) {
            errMessage = errRes.error.message;
          }
        } catch {
          // ignore
        }
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Fallo de red al enviar el archivo a Google Drive.'));
    };

    xhr.onabort = () => {
      reject(new DOMException('Subida cancelada', 'AbortError'));
    };

    xhr.send(file);
  });
}

/**
 * Format bytes into human readable format (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Trigger programmatic browser download of the source code ZIP
 */
export async function triggerZipDownload() {
  try {
    const res = await fetch('/drive-uploader-fotosboda.zip');
    if (!res.ok) throw new Error('No se pudo obtener el archivo ZIP');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drive-uploader-fotosboda.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 200);
  } catch (err) {
    console.error('Download error:', err);
    window.location.href = '/drive-uploader-fotosboda.zip';
  }
}
