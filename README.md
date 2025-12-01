# Math Spy Game

A 2D browser game where you play as a secret agent who must solve math equations to complete missions (disarm bombs, collect intel, etc.) while avoiding enemies.

**Play at: [mathspygame.com](https://mathspygame.com)**

## Features

- **Player Movement**: Use WASD or Arrow keys to move your agent around the level
- **Math Challenges**: Solve arithmetic problems (addition, subtraction, multiplication, division) to complete objectives
- **Mission System**: Complete missions by disarming bombs, collecting intel, and unlocking doors
- **Multiple Levels**: Progress through 10 different missions with increasing difficulty
- **Enemy Avoidance**: Steer clear of patrolling enemies or lose health
- **Stealth System**: Hide ability to avoid detection (one-time use per level)
- **Combat System**: Shoot projectiles at enemies
- **Inventory System**: Collect keys, money, secrets, and health items
- **Health & Score System**: Track your health and score as you progress
- **Pixel Art Editor**: Create custom 64x64 pixel art sprites for all game entities
- **Map Editor**: Built-in level editor for creating custom missions

## How to Play

1. Visit [mathspygame.com](https://mathspygame.com) or open `index.html` in a modern web browser
2. Use **WASD** or **Arrow Keys** to move your agent
3. Approach interactive objects (bombs and intel briefcases)
4. When near an object, press **E** or **Space** to interact
5. Solve the math equation that appears
6. Collect keys and secrets to unlock doors
7. Complete all missions to win!

## Controls

- **WASD** or **Arrow Keys**: Move agent
- **E** or **Space**: Interact with objects
- **Enter**: Submit math answer
- **H**: Hide/Stealth (one-time use per level, lasts 5 seconds)
- **Left Click**: Shoot projectile at enemies

## Game Mechanics

- **Bombs**: Must be disarmed by solving math problems
- **Intel Briefcases**: Collect to unlock bombs and earn points
- **Keys**: Collect to unlock locked doors
- **Secrets**: Collect to unlock secret doors
- **Money**: Collect for bonus points
- **Health Packs**: Restore health
- **Enemies**: Red agents that patrol and shoot - avoid them or fight back!
- **Doors**: Locked doors require keys or secrets to unlock
- **Health**: Starts at 100, decreases when hit by enemies or answering incorrectly
- **Score**: Earn points for completing objectives

## File Structure

```
MathSpyGame/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── README.md          # This file
├── CNAME              # Domain configuration
└── src/
    ├── main.js        # Game entry point and loop
    ├── input.js       # Keyboard and mouse input handling
    ├── gameState.js   # Core game state management
    ├── render.js      # Canvas rendering with pixel art support
    ├── mathEngine.js  # Math question generation
    ├── missions.js    # Mission system
    ├── levels.js      # Level definitions
    ├── map.js         # Map system and collision detection
    ├── audio.js       # Audio management
    ├── gameConfig.js  # Game configuration
    ├── devEditor.js   # Map editor
    ├── pixelArtEditor.js  # Pixel art sprite editor
    ├── spriteManager.js   # Sprite management
    └── levelLayouts/  # Level layout JSON files
        ├── layoutLoader.js
        ├── mission01.json
        ├── mission02.json
        └── ... (missions 03-10)
```

## Technical Details

- Built with vanilla JavaScript (ES6 modules)
- Uses HTML5 Canvas for rendering
- Pixel art sprite system (64x64 sprites)
- Bootstrap Icons for UI elements
- No external dependencies required (except Bootstrap Icons CDN)
- Runs entirely in the browser
- LocalStorage for saving game progress and custom sprites

## Development Tools

- **Map Editor**: Press the dev key in-game to open the map editor
- **Sprite Editor**: Access from the map editor to create custom pixel art sprites
- **Level Editor**: Create and export custom level layouts as JSON

## Website

Visit [mathspygame.com](https://mathspygame.com) to play the game online.
