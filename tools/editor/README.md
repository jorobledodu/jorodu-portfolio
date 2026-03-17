# Editor de Proyectos

Uso local:

1. Abre `tools/editor/index.html` en el navegador.
2. Rellena los campos o carga un proyecto existente.
3. Genera el JSON.
4. Pulsa `Guardar en el portfolio`.
5. Selecciona la carpeta `content/projects` del repo.
6. El editor crea `content/projects/<id>/`, sus subcarpetas y `project.json`.
7. Si aun no tienes media, marca el proyecto como pendiente de media.
8. Anade assets cuando quieras.
9. Ejecuta `tools/rebuild-portfolio.bat`.

Convenciones recomendadas:

- Imagenes: `content/projects/<id>/images/...`
- Videos: `content/projects/<id>/videos/...`
- PDFs: `content/projects/<id>/pdf/...`
- WebGL: `content/projects/<id>/webgl/...`
- Descarga: `links.download` puede apuntar a `https://github.com/<usuario>/<repo>/releases/latest`
- PDFs multiples: usa `links.pdfs` con una lista de documentos
- Dentro de `project.json`, usa rutas relativas como `images/thumbnail.jpg`, `videos/trailer.mp4` o `webgl/index.html`
- Si el nombre del archivo es unico dentro de la carpeta del proyecto, tambien puedes escribir solo el nombre, por ejemplo `thumbnail.jpg` o `memoria.pdf`
- El editor incluye presets de curso academico sincronizados con tu timeline actual y presets de iconos comunes para tags
- Los proyectos con `pendingMedia` aparecen en el portfolio con placeholder hasta que anadas la media real

Notas:

- El editor funciona en local y no esta enlazado desde el portfolio publico.
- Si `portfolioData.js` esta disponible, detecta IDs ya usados y permite cargar proyectos existentes.
- `portfolioData.js` es un archivo generado automaticamente desde `content/ui.json` y `content/projects/**/project.json`.
