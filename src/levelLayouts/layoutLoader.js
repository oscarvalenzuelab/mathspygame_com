const KNOWN_LAYOUTS = [1, 2, 3];
export const LEVEL_LAYOUTS = {};

export async function loadLayouts() {
    const jobs = KNOWN_LAYOUTS.map(async (level) => {
        try {
            const padded = level.toString().padStart(2, '0');
            const url = new URL(`./mission${padded}.json?v=20231130`, import.meta.url);
            const response = await fetch(url);
            if (!response.ok) return;
            const json = await response.json();
            LEVEL_LAYOUTS[level] = json;
        } catch (error) {
            console.warn(`Failed to load layout for level ${level}`, error);
        }
    });
    await Promise.all(jobs);
}
