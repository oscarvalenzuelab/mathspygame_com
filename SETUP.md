# Setup Instructions

## Important: Running the Game

This game uses ES6 modules, which **require a local web server** to run. You cannot simply open `index.html` directly in your browser using the `file://` protocol.

## Quick Start

### Option 1: Python HTTP Server (Recommended)

1. Open a terminal in the project directory
2. Run one of these commands:

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

3. Open your browser and go to: `http://localhost:8000`

### Option 2: Node.js HTTP Server

If you have Node.js installed:

```bash
npx http-server -p 8000
```

Then open: `http://localhost:8000`

### Option 3: VS Code Live Server

If you're using VS Code:
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Troubleshooting

### Game doesn't load / blank screen
- Make sure you're using a local web server (not file://)
- Check the browser console (F12) for errors
- Ensure all files are in the correct directory structure

### Controls don't work
- Make sure the canvas has focus (click on it)
- Try refreshing the page
- Check browser console for JavaScript errors

### Math questions don't appear
- Make sure you're close enough to the object (within 50 pixels)
- Press E or Space when near an object
- Check browser console for errors

## File Structure

Make sure your files are organized like this:

```
AgentFran/
├── index.html
├── styles.css
├── README.md
└── src/
    ├── main.js
    ├── input.js
    ├── gameState.js
    ├── render.js
    ├── mathEngine.js
    └── missions.js
```

