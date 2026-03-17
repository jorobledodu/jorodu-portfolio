# Content Source

Esta carpeta es la fuente de verdad del contenido del portfolio.

- `ui.json`: textos globales del sitio
- `projects/<id>/project.json`: un fichero por proyecto
- `projects/<id>/...`: assets propios del proyecto, preferiblemente en `images/`, `videos/`, `pdf/` y `webgl/`

Workflow:

1. Crea o edita un proyecto desde `tools/editor/index.html`
2. Usa `Guardar en el portfolio` y selecciona `content/projects`
3. El editor crea `content/projects/<id>/project.json` y `images/`, `videos/`, `pdf/`, `webgl/` si faltan
4. Anade los assets cuando quieras
5. Ejecuta `tools/rebuild-portfolio.bat`
6. Se regenera `portfolioData.js`

No edites `portfolioData.js` manualmente: se genera automaticamente.
Los proyectos con `"pendingMedia": true` se publican en el portfolio con placeholder hasta que los completes.
