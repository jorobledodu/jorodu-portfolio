const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const projectsDir = path.join(rootDir, 'content', 'projects');
const subfolders = ['images', 'videos', 'pdf', 'webgl'];

let created = 0;

for (const entry of fs.readdirSync(projectsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const projectDir = path.join(projectsDir, entry.name);
    const projectFile = path.join(projectDir, 'project.json');
    if (!fs.existsSync(projectFile)) continue;

    for (const folder of subfolders) {
        const fullPath = path.join(projectDir, folder);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            created += 1;
        }
    }
}

console.log(`Estructura sincronizada. Carpetas creadas: ${created}.`);
