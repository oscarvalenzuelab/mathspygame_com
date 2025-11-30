const KNOWN_LAYOUTS = Array.from({ length: 10 }, (_, i) => i + 1);
export const LEVEL_LAYOUTS = {};

export async function loadLayouts() {
    console.log('Loading layouts...', KNOWN_LAYOUTS);
    const jobs = KNOWN_LAYOUTS.map(async (level) => {
        try {
            const padded = level.toString().padStart(2, '0');
            const url = new URL(`./mission${padded}.json?v=20231130`, import.meta.url);
            console.log(`Fetching layout for level ${level} from:`, url.href);
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Failed to fetch layout for level ${level}: ${response.status} ${response.statusText}`);
                return;
            }
            const json = await response.json();
            LEVEL_LAYOUTS[level] = json;
            console.log(`Loaded layout for level ${level}`, json);
        } catch (error) {
            console.warn(`Failed to load layout for level ${level}`, error);
        }
    });
    await Promise.all(jobs);
    console.log('All layouts loaded:', LEVEL_LAYOUTS);
}
