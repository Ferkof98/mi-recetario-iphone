MI RECETARIO INTELIGENTE - PWA BETA PARA IPHONE

Esta carpeta es independiente del proyecto Android.
Para usarla en iPhone se debe publicar en HTTPS (por ejemplo GitHub Pages).
Abrir index.html directamente como archivo local no equivale a instalar una PWA.

Incluye:
- Interfaz original adaptada para Safari y pantalla de inicio.
- Alta de clave personal de Gemini (almacenamiento local por dispositivo).
- Recetas por nombre o descripción, Mi nevera, editar con Gemini.
- Biblioteca, importar/exportar JSON, fotos de galería, cocina guiada.
- Manifest y service worker para instalación y uso parcial sin conexión.

NO incluye aún: análisis de video local, extracción de contenido de enlaces,
descarga de videos externos. No se finge acceso a esos videos.
La generación Gemini necesita Internet y una clave propia.
El almacenamiento del navegador puede borrarse: exportar JSON regularmente.
La clave guardada en localStorage no tiene la protección del almacén de claves
nativo de Android; para un despliegue público hay que revisar seguridad y
políticas de API, CORS y cuotas. No incluir claves en el repositorio.
No se ha verificado aún en un iPhone real.
