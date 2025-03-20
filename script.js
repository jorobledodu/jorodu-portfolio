/**
 * Main script file for the portfolio website.
 * Handles theme switching, translations, project filtering, and UI interactions.
 * @module script
 */

import svgIcons from './svg-icons.js';
import { SITE_VERSION } from './version.js';

document.addEventListener('DOMContentLoaded', async () => {
    // DOM element references for better performance and maintainability
    const DOM = {
        themeToggle: document.getElementById('theme-toggle'),
        body: document.body,
        langButtons: document.querySelectorAll('.lang-btn'),
        i18nElements: document.querySelectorAll('[data-i18n]'),
        i18nPlaceholders: document.querySelectorAll('[data-i18n-placeholder]'),
        projectsGrid: document.querySelector('.grid-proyectos'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        noResultsMessage: document.getElementById('no-results'),
        modal: document.getElementById('modal-proyecto'),
        closeModal: document.querySelector('.close-button'),
        modalTitle: document.getElementById('modal-titulo-proyecto'),
        modalImage: document.getElementById('modal-img-proyecto'),
        modalDescription: document.getElementById('modal-descripcion-proyecto'),
        modalGallery: document.getElementById('modal-galeria-proyecto'),
        modalTags: document.getElementById('modal-etiquetas-proyecto'),
        modalLinks: document.getElementById('modal-links'),
        contactForm: document.getElementById('contact-form'),
        formSuccess: document.getElementById('form-success'),
        backToTop: document.getElementById('back-to-top'),
        skillLevels: document.querySelectorAll('.skill-level'),
        gameOverlay: document.getElementById('game-demo-overlay'),
        gameFrame: document.getElementById('game-frame'),
        herramientasContainer: document.querySelector('.herramientas .etiquetas-tecnologias'), // Contenedor de herramientas
        socialIcons: document.querySelectorAll('.svg-icon'), // Iconos de redes sociales
        profileImgContainer: document.querySelector('.profile-img-container'), // Added profile image container reference
        versionDisplay: document.getElementById('version-display'),
        siteVersionElement: document.getElementById('site-version')
    };

    // Estado de la aplicación
    const state = {
        portfolioData: null,
        currentFilter: 'all',
        currentLang: localStorage.getItem('language') || 'es',
        currentTheme: localStorage.getItem('theme') || 'dark',
        activeProject: null,
        profileImgFlipped: false // Added state to track if profile image is flipped
    };

    // Lista de habilidades (fuera de las funciones, para que sea accesible globalmente)
    const allSkills = [
        { name: "Unity", iconClass: "unity" },
        { name: "C#", iconClass: "csharp" },
        { name: "HTML", iconClass: "html" },
        { name: "CSS", iconClass: "css" },
        { name: "GitHub", iconClass: "git" },
        { name: "Unreal Engine", iconClass: "unrealengine" }
    ];

    // Cargar datos del portfolio
    async function loadPortfolioData() {
        try {
            // Add version parameter to prevent caching
            const response = await fetch(`portfolioData.json?v=${new Date().getTime()}`);
            const data = await response.json();
            return data; // Return the data directly to preserve original order
        } catch (error) {
            console.error('Error loading portfolio data:', error);
            // Mostrar mensaje de error al usuario
            const errorDiv = document.createElement('div');
            errorDiv.textContent = translations[state.currentLang]["load-error"]; // Usa la traducción
            errorDiv.style.color = 'red';
            DOM.projectsGrid.parentElement.insertBefore(errorDiv, DOM.projectsGrid);
            return { items: [] }; // Return empty items array with the same structure
        }
    }

    // Sistema de temas
    function applyTheme(theme) {
        DOM.body.classList.remove('light-theme', 'dark-theme');
        DOM.body.classList.add(`${theme}-theme`);
        localStorage.setItem('theme', theme);
        state.currentTheme = theme;

        // Actualizar colores específicos (simplificado)
        const root = document.documentElement;
        root.style.setProperty('--current-text', theme === 'dark' ? '#F8F9FA' : '#2D3436');
        root.style.setProperty('--current-bg', theme === 'dark' ? '#1a1a1a' : '#F8F9FA');
    }

    // Sistema de traducción
    function applyTranslations(lang) {
        DOM.i18nElements.forEach(element => {
            const key = element.dataset.i18n;
            element.textContent = translations[lang][key];
        });

        DOM.i18nPlaceholders.forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            element.placeholder = translations[lang][key];
        });
    }

    // Function to handle profile image flip for mobile devices
    function setupProfileImageInteraction() {
        if (DOM.profileImgContainer) {
            // Add touch event for mobile devices
            DOM.profileImgContainer.addEventListener('click', () => {
                const profileImgInner = DOM.profileImgContainer.querySelector('.profile-img-inner');
                if (profileImgInner) {
                    // Toggle the flipped state
                    state.profileImgFlipped = !state.profileImgFlipped;
                    
                    // Apply or remove the rotation based on state
                    if (state.profileImgFlipped) {
                        profileImgInner.style.transform = 'rotateY(180deg)';
                    } else {
                        profileImgInner.style.transform = 'rotateY(0deg)';
                    }
                }
            });
        }
    }

    /**
     * Filters projects based on the current filter type (all, game, or project)
     * and updates the display accordingly.
     */
    function filterProjects() {
        const allProjects = state.portfolioData.items;
        const filtered = state.currentFilter === 'all'
            ? allProjects
            : allProjects.filter(project => project.type === state.currentFilter);

        renderProjects(filtered);
        DOM.noResultsMessage.style.display = filtered.length ? 'none' : 'block';
    }

    // Renderizar proyectos
    function renderProjects(projects) {
        DOM.projectsGrid.innerHTML = projects.map(project => {
            const isVideoThumbnail = project.thumbnail && project.thumbnail.toLowerCase().endsWith('.mp4');
            const thumbnailContent = isVideoThumbnail ? 
                `<div class="card-img-container video-thumbnail">
                    <video muted loop playsinline class="img-proyecto">
                        <source src="${project.thumbnail}" type="video/mp4">
                    </video>
                    <i class="fas fa-play video-play-icon"></i>
                </div>` :
                `<div class="card-img-container">
                    <img src="${project.thumbnail}" alt="${project.altThumbnail || project.title}" class="img-proyecto" loading="lazy">
                </div>`;

            return `
            <div class="tarjeta-proyecto" data-type="${project.type}" data-project="${project.title}">
                ${thumbnailContent}
                <div class="card-content">
                    <h3>${project.title}</h3>
                    <p class="project-description">${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
                    
                    <div class="project-meta">
                        <div class="project-release-date">
                            <i class="fas fa-calendar-alt"></i> ${project.releaseDate || 'En desarrollo'}
                        </div>
                        ${project.playable !== undefined ? `
                        <div class="project-status ${project.playable ? 'playable' : 'not-playable'}">
                            <i class="fas ${project.playable ? 'fa-gamepad' : 'fa-code'}">
                            </i> ${project.playable ? translations[state.currentLang]["playable"] : translations[state.currentLang]["not-playable"]}
                        </div>` : ''}
                        ${project.academic ? `
                        <div class="project-academic" title="${project.academic.institution} - ${project.academic.course} (${project.academic.year})">
                            <i class="fas fa-graduation-cap"></i> Académico
                        </div>` : ''}
                    </div>
                    
                    <ul class="etiquetas-tecnologias">
                     ${project.tags.slice(0, 3).map(tag => {
                        const tagName = tag.name.toLowerCase();
                        const tagKey = tagName === 'c#' ? 'csharp' : tagName.replace(/[\s\/]+/g, '');
                        return svgIcons[tagKey] ?
                            `<li>${svgIcons[tagKey]} ${tag.name}</li>` :
                            `<li><i class="${tag.iconClass}"></i> ${tag.name}</li>`;
                    }).join('')}
                    </ul>
                    
                    <div class="botones-proyecto">
                        ${project.playable && project.links.demo ? `
                        <button class="play-demo-btn-card" data-demo="${project.links.demo || '#'}" aria-label="Jugar demo de ${project.title}">
                            <i class="fas fa-play"></i>
                        </button>` : ''}
                        ${project.links.itch ? `
                        <a href="${project.links.itch}" target="_blank" class="boton-icono" aria-label="Ir a ${project.title} en Itch.io">
                            <i class="fab fa-itch-io"></i>
                        </a>` : ''}
                        ${project.links.github ? `
                        <a href="${project.links.github}" target="_blank" class="boton-icono" aria-label="Ir a ${project.title} en GitHub">
                            <i class="fab fa-github"></i>
                        </a>` : ''}
                        ${project.links.pdf ? `
                        <a href="${project.links.pdf}" target="_blank" class="boton-icono" aria-label="Ver documento PDF de ${project.title}">
                            <i class="fas fa-file-pdf"></i>
                        </a>` : ''}
                    </div>
                </div>
          </div>
        `}).join('');

        // Añadir event listeners a las tarjetas DESPUÉS de renderizarlas
        document.querySelectorAll('.tarjeta-proyecto').forEach(card => {
            card.addEventListener('click', () => openProjectModal(card.dataset.project));
        });

        // Event listeners para los botones de demo (si existen)
        document.querySelectorAll('.play-demo-btn-card').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Evita que el clic se propague al contenedor de la tarjeta
                openGameDemo(button.dataset.demo);
            });
        });

        // Initialize video thumbnails
        document.querySelectorAll('.video-thumbnail video').forEach(video => {
            // Make sure video is muted to allow autoplay
            video.muted = true;
            video.loop = true;
            video.preload = 'metadata';
            
            // Play/pause on hover
            const card = video.closest('.tarjeta-proyecto');
            if (card) {
                card.addEventListener('mouseenter', () => {
                    // Ensure video is ready before playing
                    if (video.readyState >= 2) {
                        video.play()
                            .then(() => {
                                const playIcon = card.querySelector('.video-play-icon');
                                if (playIcon) playIcon.style.display = 'none';
                            })
                            .catch(e => console.log('Video play error:', e));
                    } else {
                        video.addEventListener('loadeddata', () => {
                            video.play()
                                .then(() => {
                                    const playIcon = card.querySelector('.video-play-icon');
                                    if (playIcon) playIcon.style.display = 'none';
                                })
                                .catch(e => console.log('Video play error on loadeddata:', e));
                        }, { once: true });
                    }
                });
                
                card.addEventListener('mouseleave', () => {
                    video.pause();
                    const playIcon = card.querySelector('.video-play-icon');
                    if (playIcon) playIcon.style.display = 'block';
                });
            }
        });
        
        // Force video element size to match container
        document.querySelectorAll('.card-img-container video').forEach(video => {
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
        });
    }

    function openGameDemo(demoUrl) {
        if (!demoUrl || demoUrl === '#') {
            alert(translations[state.currentLang]["demo-unavailable"]);
            return;
        }
        // Establecer la URL del iframe y mostrar el overlay
        DOM.gameFrame.src = demoUrl;
        const gameDemoTitle = document.getElementById('game-demo-title');
        if (gameDemoTitle && state.activeProject) {
            gameDemoTitle.textContent = state.activeProject.title;
            // Apply custom dimensions if available
            if (state.activeProject.demoSize) {
                const container = document.querySelector('.game-frame-container');
                const frame = DOM.gameFrame;
                frame.style.width = state.activeProject.demoSize.width + 'px';
                frame.style.height = state.activeProject.demoSize.height + 'px';
                container.style.width = state.activeProject.demoSize.width + 'px';
                container.style.height = state.activeProject.demoSize.height + 'px';
            }
        }
        DOM.gameOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function createGalleryItem(source) {
        const isVideo = source.toLowerCase().endsWith('.mp4');
        
        if (isVideo) {
            const videoElement = document.createElement('video');
            videoElement.src = source;
            videoElement.controls = false;
            videoElement.muted = true;
            videoElement.style.width = '150px';
            videoElement.style.height = '100px';
            videoElement.style.objectFit = 'cover';
            videoElement.style.pointerEvents = 'none';
            const videoContainer = document.createElement('div');
            videoContainer.style.position = 'relative';
            videoContainer.style.width = '150px';
            videoContainer.style.height = '100px';
            videoContainer.appendChild(videoElement);
            const playIcon = document.createElement('i');
            playIcon.className = 'fas fa-play';
            playIcon.style.position = 'absolute';
            playIcon.style.top = '50%';
            playIcon.style.left = '50%';
            playIcon.style.transform = 'translate(-50%, -50%)';
            playIcon.style.color = 'white';
            playIcon.style.fontSize = '24px';
            playIcon.style.textShadow = '0 0 10px rgba(0,0,0,0.5)';
            videoContainer.appendChild(playIcon);
            videoContainer.addEventListener('click', () => {
                // First, clean up any existing videos
                const existingVideos = DOM.modalImage.parentNode.querySelectorAll('video');
                existingVideos.forEach(video => {
                    video.pause();
                    video.src = '';
                    video.remove();
                });
                
                // Hide the image and create a new video element
                DOM.modalImage.style.display = 'none';
                const modalVideo = document.createElement('video');
                modalVideo.src = source;
                modalVideo.controls = true;
                modalVideo.style.width = '100%';
                modalVideo.style.height = 'auto';
                modalVideo.style.maxHeight = '600px';
                modalVideo.style.objectFit = 'contain';
                modalVideo.setAttribute('id', 'current-modal-video');
                DOM.modalImage.parentNode.insertBefore(modalVideo, DOM.modalImage);
                
                // Remove any existing active class
                document.querySelectorAll('#modal-galeria-proyecto img, #modal-galeria-proyecto video, #modal-galeria-proyecto div').forEach(item => item.classList.remove('active'));
                videoContainer.classList.add('active');
            });
            return videoContainer;
        } else {
            const imgElement = document.createElement('img');
            imgElement.src = source;
            imgElement.alt = state.activeProject.altGallery?.[state.activeProject.gallery.indexOf(source)] || state.activeProject.title;
            imgElement.loading = "lazy";
            imgElement.addEventListener('click', () => {
                DOM.modalImage.style.display = 'block';
                const existingVideos = DOM.modalImage.parentNode.querySelectorAll('video');
                existingVideos.forEach(video => {
                    video.pause();
                    video.src = '';
                    video.remove();
                });
                DOM.modalImage.src = source;
                DOM.modalImage.alt = imgElement.alt;
                document.querySelectorAll('#modal-galeria-proyecto img, #modal-galeria-proyecto video').forEach(item => item.classList.remove('active'));
                imgElement.classList.add('active');
            });
            return imgElement;
        }
    }

    // Abrir modal de proyecto
    function openProjectModal(projectName) {
        const project = state.portfolioData.items.find(p => p.title === projectName);
        if (!project) return;

        state.activeProject = project;
        DOM.modalTitle.textContent = project.title;
        DOM.modalImage.src = project.thumbnail;
        DOM.modalImage.alt = project.altThumbnail || project.title;
        DOM.modalDescription.textContent = project.description;
        
        // Remove any existing modal-meta containers to prevent accumulation
        const existingMetaContainers = document.querySelectorAll('.modal-meta');
        existingMetaContainers.forEach(container => container.remove());
        
        // Crear contenedor para las etiquetas meta (fecha, jugabilidad, académico)
        const modalMetaContainer = document.createElement('div');
        modalMetaContainer.className = 'modal-meta';
        
        // Añadir etiqueta de fecha de lanzamiento
        const releaseDateTag = document.createElement('div');
        releaseDateTag.className = 'project-release-date';
        releaseDateTag.innerHTML = `<i class="fas fa-calendar-alt"></i> ${project.releaseDate || 'En desarrollo'}`;
        modalMetaContainer.appendChild(releaseDateTag);
        
        // Añadir etiqueta de jugabilidad si está definida
        if (project.playable !== undefined) {
            const playableTag = document.createElement('div');
            playableTag.className = `project-status ${project.playable ? 'playable' : 'not-playable'}`;
            playableTag.innerHTML = `<i class="fas ${project.playable ? 'fa-gamepad' : 'fa-code'}"></i> ${project.playable ? translations[state.currentLang]["playable"] : translations[state.currentLang]["not-playable"]}`;
            modalMetaContainer.appendChild(playableTag);
        }
        
        // Añadir etiqueta académica si corresponde
        if (project.academic) {
            const academicTag = document.createElement('div');
            academicTag.className = 'project-academic';
            academicTag.title = `${project.academic.institution} - ${project.academic.course} (${project.academic.year})`;
            academicTag.innerHTML = `<i class="fas fa-graduation-cap"></i> Académico`;
            modalMetaContainer.appendChild(academicTag);
        }
        
        // Insertar el contenedor de etiquetas después del título
        DOM.modalTitle.parentNode.insertBefore(modalMetaContainer, DOM.modalDescription);

        // Limpiar galería y enlaces anteriores
        DOM.modalGallery.innerHTML = '';
        DOM.modalTags.innerHTML = '';
        DOM.modalLinks.innerHTML = '';

        // Llenar la galería
        if (project.gallery && project.gallery.length > 0) {
            project.gallery.forEach(source => {
                DOM.modalGallery.appendChild(createGalleryItem(source));
            });
            // Establecer el primer elemento de la galería como activo por defecto
            if (project.gallery.length > 0) {
                const firstSource = project.gallery[0];
                const isFirstItemVideo = firstSource.toLowerCase().endsWith('.mp4');
                
                if (isFirstItemVideo) {
                    // Si es un video, ocultamos la imagen principal y creamos un elemento de video
                    DOM.modalImage.style.display = 'none';
                    const modalVideo = document.createElement('video');
                    modalVideo.src = firstSource;
                    modalVideo.controls = true;
                    modalVideo.style.width = '100%';
                    modalVideo.style.height = 'auto';
                    modalVideo.style.maxHeight = '600px';
                    modalVideo.style.objectFit = 'contain';
                    modalVideo.setAttribute('id', 'current-modal-video');
                    DOM.modalImage.parentNode.insertBefore(modalVideo, DOM.modalImage);
                } else {
                    // Si es una imagen, mostramos la imagen principal
                    DOM.modalImage.style.display = 'block';
                    DOM.modalImage.src = firstSource;
                    DOM.modalImage.alt = project.altGallery?.[0] || project.title;
                }
                
                DOM.modalGallery.firstChild.classList.add('active');
            }
        }
        // Llenar etiquetas (tags)
        project.tags.forEach(tag => {
            const li = document.createElement('li');
            const tagName = tag.name.toLowerCase();
            // Special handling for C# tag
            const tagKey = tagName === 'c#' ? 'csharp' : tagName.replace(/[\s\/]+/g, '');

            if (svgIcons[tagKey]) {
                li.innerHTML = `${svgIcons[tagKey]} ${tag.name}`;
            } else {
                li.innerHTML = `<i class="${tag.iconClass}"></i> ${tag.name}`;
            }

            DOM.modalTags.appendChild(li);
        });
        
        // Ya no añadimos la etiqueta académica aquí porque la hemos movido a la parte superior del modal


        // Llenar enlaces con los mismos botones que aparecen en las tarjetas
        DOM.modalLinks.innerHTML = `
            ${project.playable && project.links.demo ? `
            <button class="play-demo-btn-card" data-demo="${project.links.demo || '#'}" aria-label="Jugar demo de ${project.title}">
                <i class="fas fa-play"></i>
            </button>` : ''}
            ${project.links.itch ? `
            <a href="${project.links.itch}" target="_blank" class="boton-icono" aria-label="Ir a ${project.title} en Itch.io">
                <i class="fab fa-itch-io"></i>
            </a>` : ''}
            ${project.links.github ? `
            <a href="${project.links.github}" target="_blank" class="boton-icono" aria-label="Ir a ${project.title} en GitHub">
                <i class="fab fa-github"></i>
            </a>` : ''}
            ${project.links.pdf ? `
            <a href="${project.links.pdf}" target="_blank" class="boton-icono" aria-label="Ver documento PDF de ${project.title}">
                <i class="fas fa-file-pdf"></i>
            </a>` : ''}
        `;

        // Añadir event listener al botón de demo en el modal
        const modalPlayButton = DOM.modalLinks.querySelector('.play-demo-btn-card');
        if (modalPlayButton) {
            modalPlayButton.addEventListener('click', () => {
                openGameDemo(modalPlayButton.dataset.demo);
            });
        }

        DOM.modal.style.display = 'block';
    }

    function renderSkills() {
        // Primero, limpiamos cualquier contenido previo para evitar duplicados
        DOM.herramientasContainer.innerHTML = '';

        // Creamos las etiquetas de las herramientas
        allSkills.forEach(skill => {
            const li = document.createElement('li');

            // Usar SVG icons para todas las habilidades
            const iconKey = skill.iconClass;
            if (svgIcons[iconKey]) {
                li.innerHTML = `${svgIcons[iconKey]} ${skill.name}`;
            } else {
                li.innerHTML = `${skill.name}`;
            }

            DOM.herramientasContainer.appendChild(li);
        });
    }


    // Función para copiar email al portapapeles
    function setupEmailCopy() {
        const copyEmailBtn = document.getElementById('copy-email');
        if (copyEmailBtn) {
            copyEmailBtn.addEventListener('click', function () {
                // Extract just the email text, ignoring the icon
                const emailText = this.textContent.trim();
                const email = emailText.replace(/^\s*\S+\s+/, ''); // Remove icon and whitespace
                
                navigator.clipboard.writeText(email).then(() => {
                    // Mostrar tooltip
                    this.classList.add('copied');

                    // Ocultar tooltip después de 2 segundos
                    setTimeout(() => {
                        this.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Error al copiar email: ', err);
                });
            });
        }
    }

    // Event listeners
    function setupEventListeners() {
        DOM.themeToggle.addEventListener('click', () => {
            const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        });

        DOM.langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const newLang = btn.dataset.lang;
                if (newLang !== state.currentLang) {
                    applyTranslations(newLang);
                    state.currentLang = newLang;
                    localStorage.setItem('language', newLang);
                    // Remover la clase 'active' de todos los botones
                    DOM.langButtons.forEach(b => b.classList.remove('active'));
                    // Añadir la clase 'active' al botón clickeado
                    btn.classList.add('active');

                    // Actualizar otros elementos si es necesario
                    renderSkills();
                }
            });
        });

        DOM.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentFilter = btn.dataset.filter;
                filterProjects();
                // Remover clase 'active'
                DOM.filterButtons.forEach(b => b.classList.remove('active'));
                // Añadir clase 'active' al botón clickeado
                btn.classList.add('active');
            });
        });

        /*  ELIMINADO event listener del buscador
        DOM.searchInput.addEventListener('input', () => {
            state.searchQuery = DOM.searchInput.value;
            filterProjects();
        });
        */

        // Function to clean up videos when closing the modal
        function cleanupModalVideos() {
            // Remove any video elements that were added
            const modalVideos = DOM.modalImage.parentNode.querySelectorAll('video');
            modalVideos.forEach(video => {
                video.pause();
                video.src = '';
                video.remove();
            });
            // Show the modal image again
            DOM.modalImage.style.display = 'block';
        }

        DOM.closeModal.addEventListener('click', () => {
            cleanupModalVideos();
            DOM.modal.style.display = 'none';
        });

        // Cerrar el modal si se hace clic fuera de él
        window.addEventListener('click', (event) => {
            if (event.target === DOM.modal) {
                cleanupModalVideos();
                DOM.modal.style.display = 'none';
            }
        });

        DOM.contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Validar el formulario
            const name = DOM.contactForm.querySelector('#from_name').value.trim();
            const email = DOM.contactForm.querySelector('#email').value.trim();
            const message = DOM.contactForm.querySelector('#message').value.trim();

            // Validación básica
            if (!name || !email || !message) {
                alert(translations[state.currentLang]["alert-complete-fields"]);
                return;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert(translations[state.currentLang]["alert-valid-email"]);
                return;
            }

            // Mostrar indicador de carga
            const submitBtn = DOM.contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${translations[state.currentLang]["contact-send"]}`;
            submitBtn.disabled = true;

            try {
                // Enviar el formulario usando EmailJS con el método sendForm como solicitado
                const serviceID = 'service_dq16f8a';
                const templateID = 'template_s3eid6f';
                
                // Usar el método sendForm directamente con el formulario
                await emailjs.sendForm(serviceID, templateID, DOM.contactForm)

                // Mostrar mensaje de éxito
                DOM.formSuccess.style.display = 'block';
                DOM.contactForm.reset(); // Limpiar el formulario

                // Ocultar el mensaje de éxito después de 5 segundos
                setTimeout(() => {
                    DOM.formSuccess.style.display = 'none';
                }, 5000);

            } catch (error) {
                console.error('Error al enviar el formulario:', error);
                alert(translations[state.currentLang]["contact-error"] || 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
            } finally {
                // Restaurar el botón
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });

        DOM.backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            // Mostrar/ocultar botón "Volver arriba"
            DOM.backToTop.style.display = (window.pageYOffset > 300) ? 'flex' : 'none';
        });

        // Cerrar el overlay de la demo
        DOM.gameOverlay.addEventListener('click', (event) => {
            if (event.target === DOM.gameOverlay || event.target.closest('#close-game')) {
                DOM.gameOverlay.style.display = 'none';
                DOM.gameFrame.src = ''; // Detener la carga del iframe
                document.body.style.overflow = 'auto'; // Restaurar el scroll
            }
        });
    }

    // Inicializar iconos SVG para redes sociales
    function initSocialIcons() {
        // Asignar los iconos SVG a los elementos correspondientes
        document.querySelector('.github-icon').innerHTML = svgIcons.github;
        document.querySelector('.linkedin-icon').innerHTML = svgIcons.linkedin;
        document.querySelector('.itchio-icon').innerHTML = svgIcons.itchio;
        document.querySelector('.twitter-icon').innerHTML = svgIcons.twitter;
    }
    // Inicialización
    async function init() {
        // Aplicar tema guardado o por defecto
        applyTheme(state.currentTheme);

        // Aplicar idioma guardado o por defecto
        applyTranslations(state.currentLang);
        DOM.langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === state.currentLang);
        });

        // Cargar datos del portfolio
        state.portfolioData = await loadPortfolioData();

        // Renderizar proyectos iniciales
        filterProjects();

        // Renderizar habilidades
        renderSkills();

        // Inicializar iconos SVG para redes sociales
        initSocialIcons();

        // Configurar copiar email
        setupEmailCopy();

        // Setup profile image interaction for mobile devices
        setupProfileImageInteraction();

        // Configurar event listeners para botones interactivos
        setupEventListeners();
    }
    init();
});
