const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const projectsDir = path.join(contentDir, 'projects');
const uiFile = path.join(contentDir, 'ui.json');
const outputFile = path.join(rootDir, 'portfolioData.js');

const projectFileCache = new Map();

function normalizarRuta(valor) {
    return String(valor).replace(/\\/g, '/');
}

function esRutaExterna(valor) {
    return /^(https?:)?\/\//i.test(valor) || /^[a-z]+:/i.test(valor) || valor.startsWith('#');
}

function listarArchivosProyecto(projectDir) {
    const cacheKey = normalizarRuta(projectDir);
    if (projectFileCache.has(cacheKey)) {
        return projectFileCache.get(cacheKey);
    }

    const files = [];

    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
    }

    walk(projectDir);
    projectFileCache.set(cacheKey, files);
    return files;
}

function buscarArchivoPorNombre(projectDir, nombreArchivo) {
    const normalizedName = normalizarRuta(nombreArchivo).toLowerCase();
    const matches = listarArchivosProyecto(projectDir)
        .filter((file) => path.basename(file).toLowerCase() === normalizedName);

    if (matches.length === 1) {
        return matches[0];
    }

    return null;
}

function resolverRutaRecurso(projectDir, valor) {
    if (!valor || typeof valor !== 'string') return valor;

    const ruta = normalizarRuta(valor.trim());
    if (!ruta || esRutaExterna(ruta) || ruta.startsWith('Resources/') || ruta.startsWith('content/')) {
        return ruta;
    }

    const rutaDirecta = path.join(projectDir, ruta);
    if (fs.existsSync(rutaDirecta)) {
        const baseRelativa = normalizarRuta(path.relative(rootDir, projectDir));
        return path.posix.normalize(`${baseRelativa}/${ruta}`);
    }

    if (!ruta.includes('/') && !ruta.includes('\\')) {
        const foundFile = buscarArchivoPorNombre(projectDir, ruta);
        if (foundFile) {
            return normalizarRuta(path.relative(rootDir, foundFile));
        }
    }

    const baseRelativa = normalizarRuta(path.relative(rootDir, projectDir));
    return path.posix.normalize(`${baseRelativa}/${ruta}`);
}

function existeRutaLocal(valor) {
    if (!valor || typeof valor !== 'string' || esRutaExterna(valor) || valor.startsWith('#')) {
        return true;
    }

    return fs.existsSync(path.join(rootDir, valor));
}

function obtenerProjectFilesRecursivos(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...obtenerProjectFilesRecursivos(fullPath));
        } else if (entry.isFile() && entry.name === 'project.json') {
            files.push(fullPath);
        }
    }

    return files;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizarTexto(valor) {
    if (!valor) return '';
    if (typeof valor === 'object' && !Array.isArray(valor)) {
        return valor.es || valor.en || '';
    }
    return String(valor);
}

function obtenerPesoCronologico(project) {
    const releaseText = normalizarTexto(project.releaseDate).toLowerCase();
    const academicYear = Number.parseInt(project.academic?.year, 10);
    const match = releaseText.match(/(19|20)\d{2}/g);
    const releaseYear = match ? Math.max(...match.map((value) => Number.parseInt(value, 10))) : NaN;

    const isInDevelopment = releaseText.includes('desarrollo') || releaseText.includes('development');

    return {
        isInDevelopment,
        year: Number.isFinite(releaseYear) ? releaseYear : (Number.isFinite(academicYear) ? academicYear : -Infinity),
        title: normalizarTexto(project.title)
    };
}

function validateProject(project, fileName) {
    const errors = [];
    const pendingMedia = Boolean(project.pendingMedia);

    if (!project.id) errors.push('missing id');
    if (!project.type) errors.push('missing type');
    if (!project.title) errors.push('missing title');
    if (!project.description) errors.push('missing description');
    if (!project.tags || !Array.isArray(project.tags) || project.tags.length === 0) errors.push('missing tags');
    if (!pendingMedia && !project.thumbnail && (!project.gallery || !Array.isArray(project.gallery) || project.gallery.length === 0)) {
        errors.push('missing thumbnail or gallery');
    }
    if (project.thumbnail && !project.altThumbnail) errors.push('missing altThumbnail');
    if ((project.gallery && project.gallery.length > 0) && !project.altGallery) errors.push('missing altGallery');

    const esGallery = project.altGallery?.es || [];
    const enGallery = project.altGallery?.en || [];
    if (project.gallery && project.gallery.length > 0 && (project.gallery.length !== esGallery.length || project.gallery.length !== enGallery.length)) {
        errors.push('gallery and altGallery lengths do not match');
    }

    if (errors.length) {
        throw new Error(`${fileName}: ${errors.join(', ')}`);
    }
}

function resolverProyecto(project, projectFile) {
    const projectDir = path.dirname(projectFile);
    const resolved = JSON.parse(JSON.stringify(project));

    resolved.thumbnail = resolverRutaRecurso(projectDir, resolved.thumbnail);

    if (Array.isArray(resolved.gallery)) {
        resolved.gallery = resolved.gallery.map((item) => resolverRutaRecurso(projectDir, item));
    }

    if (resolved.links && typeof resolved.links === 'object') {
        for (const key of Object.keys(resolved.links)) {
            if (key === 'pdfs' && Array.isArray(resolved.links.pdfs)) {
                resolved.links.pdfs = resolved.links.pdfs.map((entry) => {
                    if (typeof entry === 'string') {
                        return resolverRutaRecurso(projectDir, entry);
                    }
                    if (entry && typeof entry === 'object') {
                        return {
                            ...entry,
                            url: resolverRutaRecurso(projectDir, entry.url)
                        };
                    }
                    return entry;
                });
            } else {
                resolved.links[key] = resolverRutaRecurso(projectDir, resolved.links[key]);
            }
        }
    }

    return resolved;
}

function validarProyectoResuelto(project, fileName) {
    if (project.pendingMedia) {
        return;
    }

    const errores = [];

    if (!existeRutaLocal(project.thumbnail)) {
        errores.push(`thumbnail no encontrado: ${project.thumbnail}`);
    }

    if (Array.isArray(project.gallery)) {
        for (const item of project.gallery) {
            if (!existeRutaLocal(item)) {
                errores.push(`gallery no encontrada: ${item}`);
            }
        }
    }

    if (project.links && typeof project.links === 'object') {
        for (const [key, value] of Object.entries(project.links)) {
            if (key === 'pdfs' && Array.isArray(value)) {
                for (const entry of value) {
                    const url = typeof entry === 'string' ? entry : entry?.url;
                    if (!existeRutaLocal(url)) {
                        errores.push(`link local no encontrado (${key}): ${url}`);
                    }
                }
                continue;
            }

            if (!existeRutaLocal(value)) {
                errores.push(`link local no encontrado (${key}): ${value}`);
            }
        }
    }

    if (errores.length) {
        throw new Error(`${fileName}: ${errores.join(', ')}`);
    }
}

function buildPortfolioData() {
    const ui = readJson(uiFile);
    const projectFiles = obtenerProjectFilesRecursivos(projectsDir)
        .sort((a, b) => normalizarRuta(path.relative(projectsDir, a)).localeCompare(normalizarRuta(path.relative(projectsDir, b)), 'es'));

    const items = projectFiles.map((file) => {
        const project = readJson(file);
        const fileName = normalizarRuta(path.relative(rootDir, file));
        validateProject(project, fileName);
        const resolved = resolverProyecto(project, file);
        validarProyectoResuelto(resolved, fileName);
        return resolved;
    }).sort((a, b) => {
        const aOrder = obtenerPesoCronologico(a);
        const bOrder = obtenerPesoCronologico(b);

        if (aOrder.isInDevelopment !== bOrder.isInDevelopment) {
            return aOrder.isInDevelopment ? -1 : 1;
        }

        if (aOrder.year !== bOrder.year) {
            return bOrder.year - aOrder.year;
        }

        return aOrder.title.localeCompare(bOrder.title, 'es');
    });

    const payload = { ui, items };
    const content = `// Generado automaticamente por tools/build-content.js. No editar a mano.\nconst portfolioData = ${JSON.stringify(payload, null, 4)};\n`;
    fs.writeFileSync(outputFile, content, 'utf8');

    return {
        count: items.length,
        projectFiles: projectFiles.map((file) => normalizarRuta(path.relative(rootDir, file)))
    };
}

try {
    const result = buildPortfolioData();
    console.log(`portfolioData.js generado con ${result.count} proyectos.`);
} catch (error) {
    console.error('Fallo al generar el contenido:', error.message);
    process.exit(1);
}
