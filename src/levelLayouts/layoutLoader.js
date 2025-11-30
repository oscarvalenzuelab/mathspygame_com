const KNOWN_LAYOUTS = [1, 2, 3];
export const LEVEL_LAYOUTS = {};

async function loadLayout(level) {
    try {
        const padded = level.toString().padStart(2, '0');
        const url = new URL(`./mission${padded}.json`, import.meta.url);
        const response = await fetch(url);
        if (!response.ok) return;
        const json = await response.json();
        LEVEL_LAYOUTS[level] = json;
    } catch (error) {
        console.warn(`Failed to load layout for level ${level}`, error);
    }
}

await Promise.all(KNOWN_LAYOUTS.map(loadLayout));
