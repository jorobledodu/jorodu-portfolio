(function () {
    const portfolioSource = typeof portfolioData !== 'undefined' ? portfolioData : null;
    const existingProjects = Array.isArray(portfolioSource?.items)
        ? portfolioSource.items
        : [];
    const existingIds = new Set(existingProjects.map((item) => item.id));

    const form = document.getElementById('project-form');
    const output = document.getElementById('output-json');
    const validationBox = document.getElementById('validation-messages');
    const idInput = document.getElementById('project-id');
    const idStatus = document.getElementById('id-status');
    const folderHint = document.getElementById('project-folder-hint');
    const tagsList = document.getElementById('tags-list');
    const pdfList = document.getElementById('pdf-list');
    const galleryList = document.getElementById('gallery-list');
    const existingProjectSelect = document.getElementById('existing-project-select');
    const importProjectFile = document.getElementById('import-project-file');
    const academicCoursePreset = document.getElementById('academic-course-preset');
    let editingProjectId = null;
    let portfolioProjectsDirectoryHandle = null;

    const iconosTag = [
        { value: 'fab fa-unity', label: 'Unity' },
        { value: 'fas fa-code', label: 'Codigo / C#' },
        { value: 'fas fa-tools', label: 'Herramientas' },
        { value: 'fas fa-cube', label: '3D / 2D' },
        { value: 'fa-solid fa-vr-cardboard', label: 'VR' },
        { value: 'fas fa-android', label: 'Android' },
        { value: 'fas fa-paint-brush', label: 'Arte / Ilustracion' },
        { value: 'fas fa-globe', label: 'Web / WebGL' },
        { value: 'fas fa-gamepad', label: 'Gameplay / Juego' },
        { value: 'fas fa-tag', label: 'Generico' },
        { value: '__custom__', label: 'Personalizado' }
    ];

    const cursosAcademicos = [
        {
            value: 'master-videojuegos',
            es: portfolioSource?.ui?.es?.['exp-master-title'] || 'Master universitario en diseno de videojuegos',
            en: portfolioSource?.ui?.en?.['exp-master-title'] || 'University Master in Game Design'
        },
        {
            value: 'grado-videojuegos',
            es: portfolioSource?.ui?.es?.['exp-degree-title'] || 'Diseno y desarrollo de videojuegos y experiencias interactivas',
            en: portfolioSource?.ui?.en?.['exp-degree-title'] || 'Game Design, Development and Interactive Experiences'
        }
    ];

    function slugify(value) {
        return (value || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function sanitizeIdInput(value) {
        return (value || '')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '');
    }

    function setValidation(message, type) {
        validationBox.textContent = message || '';
        validationBox.className = 'validation-box' + (type ? ` ${type}` : '');
    }

    function updateFolderHint() {
        if (!folderHint) return;
        const value = slugify(idInput.value) || 'nuevo-proyecto';
        folderHint.textContent = `content/projects/${value}/`;
    }

    function createFieldBlock(labelText, input) {
        const block = document.createElement('label');
        block.className = 'field-block';
        const label = document.createElement('span');
        label.textContent = labelText;
        block.append(label, input);
        return block;
    }

    function createInput(type, placeholder) {
        const input = document.createElement('input');
        input.type = type;
        if (placeholder) input.placeholder = placeholder;
        return input;
    }

    function createSelect(options, selectedValue = '') {
        const select = document.createElement('select');
        for (const optionData of options) {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.label;
            if (optionData.value === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        }
        return select;
    }

    function addTagItem(data = {}) {
        const item = document.createElement('div');
        item.className = 'dynamic-item tag-item';

        const title = document.createElement('strong');
        title.textContent = 'Tag';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-btn small-btn';
        remove.textContent = 'Eliminar';
        remove.addEventListener('click', () => item.remove());

        const header = document.createElement('div');
        header.className = 'dynamic-item-header';
        header.append(title, remove);

        const grid = document.createElement('div');
        grid.className = 'field-grid two-col';

        const nameEs = createInput('text', 'Nombre ES');
        nameEs.value = data.nameEs || '';
        const nameEn = createInput('text', 'Nombre EN');
        nameEn.value = data.nameEn || '';
        const iconPreset = createSelect(iconosTag, iconosTag.some((item) => item.value === data.iconClass) ? data.iconClass : (data.iconClass ? '__custom__' : 'fas fa-tag'));
        const iconClass = createInput('text', 'fas fa-star');
        iconClass.value = iconPreset.value === '__custom__' ? (data.iconClass || '') : '';
        iconClass.style.display = iconPreset.value === '__custom__' ? 'block' : 'none';

        iconPreset.addEventListener('change', () => {
            iconClass.style.display = iconPreset.value === '__custom__' ? 'block' : 'none';
            if (iconPreset.value !== '__custom__') {
                iconClass.value = '';
            }
        });

        grid.append(
            createFieldBlock('Nombre ES', nameEs),
            createFieldBlock('Nombre EN', nameEn),
            createFieldBlock('Icono', iconPreset),
            createFieldBlock('Clase personalizada', iconClass)
        );

        item.append(header, grid);
        item._fields = { nameEs, nameEn, iconClass, iconPreset };
        tagsList.appendChild(item);
    }

    function addPdfItem(data = {}) {
        const item = document.createElement('div');
        item.className = 'dynamic-item pdf-item';

        const title = document.createElement('strong');
        title.textContent = 'PDF';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-btn small-btn';
        remove.textContent = 'Eliminar';
        remove.addEventListener('click', () => item.remove());

        const header = document.createElement('div');
        header.className = 'dynamic-item-header';
        header.append(title, remove);

        const grid = document.createElement('div');
        grid.className = 'field-grid two-col';

        const url = createInput('text', 'pdf/memoria.pdf');
        url.value = data.url || '';
        const labelEs = createInput('text', 'Memoria, dossier, GDD...');
        labelEs.value = data.labelEs || '';
        const labelEn = createInput('text', 'Memory, dossier, GDD...');
        labelEn.value = data.labelEn || '';

        grid.append(
            createFieldBlock('Ruta PDF', url),
            createFieldBlock('Etiqueta ES', labelEs),
            createFieldBlock('Etiqueta EN', labelEn)
        );

        item.append(header, grid);
        item._fields = { url, labelEs, labelEn };
        pdfList.appendChild(item);
    }

    function addGalleryItem(data = {}) {
        const item = document.createElement('div');
        item.className = 'dynamic-item gallery-item';

        const title = document.createElement('strong');
        title.textContent = 'Media';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-btn small-btn';
        remove.textContent = 'Eliminar';
        remove.addEventListener('click', () => item.remove());

        const header = document.createElement('div');
        header.className = 'dynamic-item-header';
        header.append(title, remove);

        const grid = document.createElement('div');
        grid.className = 'field-grid';

        const src = createInput('text', 'Resources/Images/my-project-1.jpg');
        src.value = data.src || '';
        const altEs = createInput('text', 'Alt ES');
        altEs.value = data.altEs || '';
        const altEn = createInput('text', 'Alt EN');
        altEn.value = data.altEn || '';

        grid.append(
            createFieldBlock('Ruta', src),
            createFieldBlock('Alt ES', altEs),
            createFieldBlock('Alt EN', altEn)
        );

        item.append(header, grid);
        item._fields = { src, altEs, altEn };
        galleryList.appendChild(item);
    }

    function getReleaseValue(es, en) {
        if (!es && !en) return '';
        if (es && en && es !== en) return { es, en };
        return es || en;
    }

    function normalizeLocalized(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return {
                es: value.es || '',
                en: value.en || value.es || ''
            };
        }
        return {
            es: value || '',
            en: value || ''
        };
    }

    function normalizeLocalizedArray(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return {
                es: Array.isArray(value.es) ? value.es : [],
                en: Array.isArray(value.en) ? value.en : Array.isArray(value.es) ? value.es : []
            };
        }
        return { es: Array.isArray(value) ? value : [], en: Array.isArray(value) ? value : [] };
    }

    function collectTags() {
        return Array.from(tagsList.querySelectorAll('.tag-item')).map((item) => {
            const { nameEs, nameEn, iconClass, iconPreset } = item._fields;
            const localizedName = nameEs.value.trim() === nameEn.value.trim()
                ? nameEs.value.trim()
                : { es: nameEs.value.trim(), en: nameEn.value.trim() };
            const resolvedIconClass = iconPreset.value === '__custom__'
                ? iconClass.value.trim()
                : iconPreset.value;

            return {
                name: localizedName,
                iconClass: resolvedIconClass || 'fas fa-tag'
            };
        }).filter((tag) => tag.name);
    }

    function collectPdfs() {
        return Array.from(pdfList.querySelectorAll('.pdf-item')).map((item) => {
            const { url, labelEs, labelEn } = item._fields;
            const trimmedUrl = url.value.trim();
            if (!trimmedUrl) return null;

            const es = labelEs.value.trim();
            const en = labelEn.value.trim();
            const entry = { url: trimmedUrl };
            if (es || en) {
                entry.label = {
                    es: es || en || '',
                    en: en || es || ''
                };
            }
            return entry;
        }).filter(Boolean);
    }

    function collectGallery() {
        const entries = Array.from(galleryList.querySelectorAll('.gallery-item')).map((item) => ({
            src: item._fields.src.value.trim(),
            altEs: item._fields.altEs.value.trim(),
            altEn: item._fields.altEn.value.trim()
        })).filter((entry) => entry.src);

        return {
            gallery: entries.map((entry) => entry.src),
            altGallery: {
                es: entries.map((entry) => entry.altEs),
                en: entries.map((entry) => entry.altEn)
            }
        };
    }

    function buildProjectObject() {
        const projectId = slugify(idInput.value);
        const titleEs = document.getElementById('title-es').value.trim();
        const titleEn = document.getElementById('title-en').value.trim();
        const descriptionEs = document.getElementById('description-es').value.trim();
        const descriptionEn = document.getElementById('description-en').value.trim();
        const thumbnail = document.getElementById('thumbnail-path').value.trim();
        const thumbnailAltEs = document.getElementById('thumbnail-alt-es-2').value.trim();
        const thumbnailAltEn = document.getElementById('thumbnail-alt-en').value.trim();
        const releaseEs = document.getElementById('release-es').value.trim();
        const releaseEn = document.getElementById('release-en').value.trim();
        const projectType = document.getElementById('project-type').value;
        const playable = document.getElementById('project-playable').checked;
        const pendingMedia = document.getElementById('project-pending-media').checked;
        const links = {
            demo: document.getElementById('link-demo').value.trim(),
            itch: document.getElementById('link-itch').value.trim(),
            github: document.getElementById('link-github').value.trim(),
            download: document.getElementById('link-download').value.trim()
        };
        const demoWidth = document.getElementById('demo-width').value.trim();
        const demoHeight = document.getElementById('demo-height').value.trim();
        const academicEnabled = document.getElementById('academic-enabled').checked;

        const messages = [];
        if (!projectId) messages.push('El ID es obligatorio.');
        if (!titleEs || !titleEn) messages.push('Los titulos ES y EN son obligatorios.');
        if (!descriptionEs || !descriptionEn) messages.push('Las descripciones ES y EN son obligatorias.');
        if (!pendingMedia && thumbnail && (!thumbnailAltEs || !thumbnailAltEn)) messages.push('Si anades thumbnail, los alt del thumbnail son obligatorios.');

        const tags = collectTags();
        if (!tags.length) messages.push('Anade al menos un tag.');
        const pdfs = collectPdfs();

        const galleryData = collectGallery();
        const galleryEntries = galleryData.gallery.map((src, index) => ({
            src,
            altEs: galleryData.altGallery.es[index] || '',
            altEn: galleryData.altGallery.en[index] || ''
        }));

        if (thumbnail) {
            const alreadyIncluded = galleryEntries.some((entry) => entry.src === thumbnail);
            if (!alreadyIncluded) {
                galleryEntries.unshift({
                    src: thumbnail,
                    altEs: thumbnailAltEs,
                    altEn: thumbnailAltEn
                });
            }
        }

        const finalGallery = galleryEntries.map((entry) => entry.src);
        const finalAltGallery = {
            es: galleryEntries.map((entry) => entry.altEs),
            en: galleryEntries.map((entry) => entry.altEn)
        };

        if (!pendingMedia && galleryData.gallery.length && (galleryData.altGallery.es.some((value) => !value) || galleryData.altGallery.en.some((value) => !value))) {
            messages.push('Cada elemento de galeria necesita alt ES y EN.');
        }

        if (!pendingMedia && !thumbnail && !galleryData.gallery.length) {
            messages.push('Anade thumbnail o galeria, o marca el proyecto como pendiente de media.');
        }

        if (existingIds.has(projectId) && projectId !== editingProjectId) {
            messages.push(`El ID "${projectId}" ya existe en portfolioData.js.`);
        }

        if (messages.length) {
            setValidation(messages.join(' '), 'error');
            return null;
        }

        const project = {
            id: projectId,
            type: projectType,
            title: { es: titleEs, en: titleEn },
            description: { es: descriptionEs, en: descriptionEn },
            thumbnail,
            releaseDate: getReleaseValue(releaseEs, releaseEn),
            playable,
            tags,
            links: Object.fromEntries(Object.entries(links).filter(([, value]) => value)),
            gallery: finalGallery,
            altThumbnail: { es: thumbnailAltEs, en: thumbnailAltEn },
            altGallery: finalAltGallery
        };

        if (pendingMedia) {
            project.pendingMedia = true;
        }

        if (pdfs.length) {
            project.links.pdfs = pdfs;
        }

        if (academicEnabled) {
            project.academic = {
                institution: document.getElementById('academic-institution').value.trim(),
                course: {
                    es: document.getElementById('academic-course-es').value.trim(),
                    en: document.getElementById('academic-course-en').value.trim()
                },
                year: document.getElementById('academic-year').value.trim()
            };
        }

        if (demoWidth && demoHeight) {
            project.demoSize = {
                width: Number(demoWidth),
                height: Number(demoHeight)
            };
        }

        setValidation(pendingMedia
            ? 'Proyecto generado como pendiente de media. Aparecera en el portfolio aunque aun no tenga imagenes o videos.'
            : 'Proyecto generado correctamente. Ya puedes copiarlo o descargarlo.', 'success');
        return project;
    }

    function renderOutput(project) {
        output.value = JSON.stringify(project, null, 4);
    }

    function loadProjectIntoForm(project) {
        const title = normalizeLocalized(project.title);
        const description = normalizeLocalized(project.description);
        const releaseDate = normalizeLocalized(project.releaseDate);
        const altThumbnail = normalizeLocalized(project.altThumbnail);
        const altGallery = normalizeLocalizedArray(project.altGallery);
        const course = normalizeLocalized(project.academic?.course);
        const pdfEntries = [];

        if (project.links?.pdf) {
            pdfEntries.push({ url: project.links.pdf, labelEs: '', labelEn: '' });
        }
        if (Array.isArray(project.links?.pdfs)) {
            for (const pdf of project.links.pdfs) {
                if (typeof pdf === 'string') {
                    pdfEntries.push({ url: pdf, labelEs: '', labelEn: '' });
                } else {
                    const label = normalizeLocalized(pdf.label);
                    pdfEntries.push({ url: pdf.url || '', labelEs: label.es, labelEn: label.en });
                }
            }
        }

        editingProjectId = project.id || null;
        idInput.value = project.id || '';
        document.getElementById('project-type').value = project.type || 'project';
        document.getElementById('release-es').value = releaseDate.es || '';
        document.getElementById('release-en').value = releaseDate.en || '';
        document.getElementById('project-playable').checked = Boolean(project.playable);
        document.getElementById('project-pending-media').checked = Boolean(project.pendingMedia);
        document.getElementById('title-es').value = title.es;
        document.getElementById('title-en').value = title.en;
        document.getElementById('description-es').value = description.es;
        document.getElementById('description-en').value = description.en;
        document.getElementById('thumbnail-path').value = project.thumbnail || '';
        document.getElementById('thumbnail-alt-es-2').value = altThumbnail.es;
        document.getElementById('thumbnail-alt-en').value = altThumbnail.en;
        document.getElementById('link-demo').value = project.links?.demo || '';
        document.getElementById('link-itch').value = project.links?.itch || '';
        document.getElementById('link-github').value = project.links?.github || '';
        document.getElementById('link-download').value = project.links?.download || '';
        document.getElementById('demo-width').value = project.demoSize?.width || '';
        document.getElementById('demo-height').value = project.demoSize?.height || '';
        document.getElementById('academic-enabled').checked = Boolean(project.academic);
        document.getElementById('academic-institution').value = project.academic?.institution || '';
        document.getElementById('academic-course-es').value = course.es;
        document.getElementById('academic-course-en').value = course.en;
        document.getElementById('academic-year').value = project.academic?.year || '';

        if (academicCoursePreset) {
            const preset = cursosAcademicos.find((item) => item.es === course.es && item.en === course.en);
            academicCoursePreset.value = preset ? preset.value : '';
        }

        tagsList.innerHTML = '';
        (project.tags || []).forEach((tag) => {
            const localizedTag = normalizeLocalized(tag.name);
            addTagItem({
                nameEs: localizedTag.es,
                nameEn: localizedTag.en,
                iconClass: tag.iconClass || ''
            });
        });

        galleryList.innerHTML = '';
        (project.gallery || []).forEach((src, index) => {
            addGalleryItem({
                src,
                altEs: altGallery.es[index] || '',
                altEn: altGallery.en[index] || ''
            });
        });

        pdfList.innerHTML = '';
        pdfEntries.forEach((pdf) => addPdfItem(pdf));

        output.value = JSON.stringify(project, null, 4);
        updateIdStatus();
        updateFolderHint();
        setValidation(`Proyecto "${project.id}" cargado en el formulario.`, 'success');
    }

    function fillTemplate(useStarterData = false) {
        editingProjectId = null;
        idInput.value = useStarterData ? 'my-new-project' : '';
        document.getElementById('project-type').value = 'project';
        document.getElementById('release-es').value = useStarterData ? '2026' : '';
        document.getElementById('release-en').value = useStarterData ? '2026' : '';
        document.getElementById('project-playable').checked = true;
        document.getElementById('project-pending-media').checked = false;
        document.getElementById('title-es').value = useStarterData ? 'Mi nuevo proyecto' : '';
        document.getElementById('title-en').value = useStarterData ? 'My New Project' : '';
        document.getElementById('description-es').value = useStarterData ? 'Descripcion breve del proyecto en espanol. Explica la idea principal, tecnologia y objetivo.' : '';
        document.getElementById('description-en').value = useStarterData ? 'Short English description of the project. Explain the core idea, technology, and goal.' : '';
        document.getElementById('thumbnail-path').value = useStarterData ? 'images/thumbnail.jpg' : '';
        document.getElementById('thumbnail-alt-es-2').value = useStarterData ? 'Imagen principal del proyecto.' : '';
        document.getElementById('thumbnail-alt-en').value = useStarterData ? 'Main image for the project.' : '';
        document.getElementById('link-demo').value = useStarterData ? 'webgl/index.html' : '';
        document.getElementById('link-itch').value = '';
        document.getElementById('link-github').value = '';
        document.getElementById('link-download').value = useStarterData ? 'https://github.com/usuario/repositorio/releases/latest' : '';
        document.getElementById('demo-width').value = useStarterData ? '960' : '';
        document.getElementById('demo-height').value = useStarterData ? '600' : '';
        document.getElementById('academic-enabled').checked = useStarterData;
        document.getElementById('academic-institution').value = useStarterData ? 'Universidad o estudio' : '';
        document.getElementById('academic-course-es').value = useStarterData ? 'Curso o programa en espanol' : '';
        document.getElementById('academic-course-en').value = useStarterData ? 'Course or program in English' : '';
        document.getElementById('academic-year').value = useStarterData ? '2026' : '';
        if (academicCoursePreset) {
            academicCoursePreset.value = '';
        }

        tagsList.innerHTML = '';
        pdfList.innerHTML = '';
        galleryList.innerHTML = '';
        addTagItem({ nameEs: 'Unity', nameEn: 'Unity', iconClass: 'fab fa-unity' });
        addTagItem({ nameEs: 'C#', nameEn: 'C#', iconClass: 'fas fa-code' });
        if (useStarterData) {
            addTagItem({ nameEs: 'WebGL', nameEn: 'WebGL', iconClass: 'fas fa-globe' });
            addGalleryItem({
                src: 'images/captura-01.jpg',
                altEs: 'Captura principal del proyecto.',
                altEn: 'Main project screenshot.'
            });
            addGalleryItem({
                src: 'videos/trailer.mp4',
                altEs: 'Trailer o video del proyecto.',
                altEn: 'Project trailer or video.'
            });
            addPdfItem({
                url: 'pdf/memoria.pdf',
                labelEs: 'Memoria del proyecto',
                labelEn: 'Project documentation'
            });
        } else {
            addGalleryItem();
        }
        output.value = '';
        setValidation(useStarterData ? 'Plantilla cargada con datos de ejemplo.' : '', useStarterData ? 'success' : '');
        if (existingProjectSelect) {
            existingProjectSelect.value = '';
        }
        if (importProjectFile) {
            importProjectFile.value = '';
        }
        updateIdStatus();
        updateFolderHint();
    }

    async function copyOutput() {
        if (!output.value.trim()) {
            setValidation('Primero genera un proyecto.', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(output.value);
            setValidation('JSON copiado al portapapeles.', 'success');
        } catch (error) {
            setValidation('No se pudo copiar automaticamente. Puedes copiarlo manualmente.', 'error');
        }
    }

    function downloadOutput() {
        if (!output.value.trim()) {
            setValidation('Primero genera un proyecto.', 'error');
            return;
        }

        const fileName = `${slugify(idInput.value || 'new-project')}.json`;
        const blob = new Blob([output.value], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    }

    async function downloadToProjectsFolder() {
        if (!output.value.trim()) {
            setValidation('Primero genera un proyecto.', 'error');
            return;
        }

        const projectId = slugify(idInput.value || 'nuevo-proyecto');
        const fileName = 'project.json';

        if (window.showDirectoryPicker) {
            try {
                if (!portfolioProjectsDirectoryHandle) {
                    portfolioProjectsDirectoryHandle = await window.showDirectoryPicker({
                        mode: 'readwrite'
                    });
                }

                const projectDirectory = await portfolioProjectsDirectoryHandle.getDirectoryHandle(projectId, { create: true });
                for (const folder of ['images', 'videos', 'pdf', 'webgl']) {
                    await projectDirectory.getDirectoryHandle(folder, { create: true });
                }

                const fileHandle = await projectDirectory.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(output.value);
                await writable.close();

                setValidation(`Proyecto guardado en content/projects/${projectId}/project.json y estructura creada (images, videos, pdf, webgl). Ejecuta tools/rebuild-portfolio.bat.`, 'success');
                return;
            } catch (error) {
                if (error.name === 'AbortError') {
                    setValidation('Guardado cancelado.', 'error');
                    return;
                }
                setValidation('No se pudo guardar directamente en el portfolio. Se ofrecera guardado manual.', 'error');
            }
        }

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'Archivos JSON',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(output.value);
                await writable.close();
                setValidation(`Archivo guardado. Colocalo en content/projects/${projectId}/project.json y crea si hace falta images, videos, pdf y webgl. Luego ejecuta tools/rebuild-portfolio.bat.`, 'success');
                return;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setValidation('No se pudo guardar directamente. Se descargara el archivo.', 'error');
                }
            }
        }

        downloadOutput();
        setValidation(`Guarda el archivo descargado como content/projects/${projectId}/project.json, crea images, videos, pdf y webgl si hace falta, y luego ejecuta tools/rebuild-portfolio.bat.`, 'success');
    }

    function populateExistingProjects() {
        if (!existingProjectSelect) return;
        const sorted = [...existingProjects].sort((a, b) => {
            const aTitle = normalizeLocalized(a.title).es || a.id;
            const bTitle = normalizeLocalized(b.title).es || b.id;
            return aTitle.localeCompare(bTitle);
        });

        for (const project of sorted) {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = `${normalizeLocalized(project.title).es || project.id} (${project.id})`;
            existingProjectSelect.appendChild(option);
        }
    }

    function populateAcademicCoursePresets() {
        if (!academicCoursePreset) return;
        for (const course of cursosAcademicos) {
            const option = document.createElement('option');
            option.value = course.value;
            option.textContent = course.es;
            academicCoursePreset.appendChild(option);
        }
    }

    async function importProjectFromFile(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const project = JSON.parse(text);
            loadProjectIntoForm(project);
        } catch (error) {
            setValidation('No se pudo leer el JSON seleccionado.', 'error');
        }
    }

    function updateIdStatus() {
        const rawValue = sanitizeIdInput(idInput.value);
        if (rawValue !== idInput.value) {
            const cursor = idInput.selectionStart;
            idInput.value = rawValue;
            if (typeof cursor === 'number') {
                idInput.setSelectionRange(Math.min(cursor, rawValue.length), Math.min(cursor, rawValue.length));
            }
        }

        const value = slugify(rawValue);
        if (!value) {
            idStatus.textContent = 'Usa minusculas, numeros y guiones. Ejemplo: gull-s-carrion';
            updateFolderHint();
            return;
        }
        if (existingIds.has(value) && value !== editingProjectId) {
            idStatus.textContent = `ID valido: ${value}. Ya existe en portfolioData.js.`;
        } else if (value === editingProjectId) {
            idStatus.textContent = `ID valido: ${value}. Estas editando este proyecto existente.`;
        } else {
            idStatus.textContent = `ID valido: ${value}. Disponible en el dataset actual.`;
        }
        updateFolderHint();
    }

    document.getElementById('add-tag').addEventListener('click', () => addTagItem());
    document.getElementById('add-pdf-item').addEventListener('click', () => addPdfItem());
    document.getElementById('add-gallery-item').addEventListener('click', () => addGalleryItem());
    document.getElementById('load-template').addEventListener('click', () => fillTemplate(true));
    document.getElementById('clear-form').addEventListener('click', () => fillTemplate(false));
    document.getElementById('copy-output').addEventListener('click', copyOutput);
    document.getElementById('download-output').addEventListener('click', downloadOutput);
    document.getElementById('download-to-projects').addEventListener('click', downloadToProjectsFolder);
    idInput.addEventListener('input', updateIdStatus);

    if (existingProjectSelect) {
        existingProjectSelect.addEventListener('change', (event) => {
            const selected = existingProjects.find((project) => project.id === event.target.value);
            if (selected) loadProjectIntoForm(selected);
        });
    }

    if (importProjectFile) {
        importProjectFile.addEventListener('change', importProjectFromFile);
    }

    if (academicCoursePreset) {
        academicCoursePreset.addEventListener('change', (event) => {
            const selected = cursosAcademicos.find((item) => item.value === event.target.value);
            if (!selected) return;
            document.getElementById('academic-course-es').value = selected.es;
            document.getElementById('academic-course-en').value = selected.en;
        });
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const project = buildProjectObject();
        if (project) renderOutput(project);
    });

    populateExistingProjects();
    populateAcademicCoursePresets();
    fillTemplate();
})();
