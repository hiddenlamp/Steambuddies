import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urls = [
  "https://www.solarsystemscope.com/textures/download/2k_sun.jpg",
  "https://www.solarsystemscope.com/textures/download/2k_mercury.jpg",
  "https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg",
  "https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg",
  "https://www.solarsystemscope.com/textures/download/2k_mars.jpg",
  "https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg",
  "https://www.solarsystemscope.com/textures/download/2k_saturn.jpg",
  "https://www.solarsystemscope.com/textures/download/2k_uranus.jpg",
  "https://www.solarsystemscope.com/textures/download/2k_neptune.jpg"
];

const destDir = path.join(__dirname, 'public', 'textures', 'planets');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

async function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                return reject(new Error(`Status: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function run() {
    console.log("Downloading planet textures...");
    for (const url of urls) {
        const filename = path.basename(url);
        const dest = path.join(destDir, filename);
        try {
            console.log(`Downloading ${filename}...`);
            await download(url, dest);
            console.log(`Saved to ${dest}`);
        } catch (e) {
            console.error(`Failed to download ${filename}:`, e.message);
        }
    }
    console.log("Done!");
}

run();
