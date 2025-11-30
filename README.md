# Secret Agent Math Game

A 2D browser game where you play as a secret agent who must solve math equations to complete missions (disarm bombs, collect intel, etc.) while avoiding enemies.

## Features

- **Player Movement**: Use WASD or Arrow keys to move your agent around the level
- **Math Challenges**: Solve arithmetic problems (addition, subtraction, multiplication) to complete objectives
- **Mission System**: Complete missions by disarming bombs and collecting intel
- **Enemy Avoidance**: Steer clear of patrolling enemies or lose health
- **Health & Score System**: Track your health and score as you progress

## How to Play

1. Open `index.html` in a modern web browser
2. Use **WASD** or **Arrow Keys** to move your agent (blue square)
3. Approach interactive objects (bombs and intel briefcases)
4. When near an object, press **E** or **Space** to interact
5. Solve the math equation that appears
6. Complete all missions to win!

## Controls

- **WASD** or **Arrow Keys**: Move agent
- **E** or **Space**: Interact with objects
- **Enter**: Submit math answer

## Game Mechanics

- **Bombs**: Must be disarmed by solving math problems
- **Intel**: Collect briefcases by solving math problems
- **Enemies**: Red squares that patrol back and forth - avoid them!
- **Health**: Starts at 100, decreases when hit by enemies or answering incorrectly
- **Score**: Earn points for completing objectives

## File Structure

```
AgentFran/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── README.md          # This file
└── src/
    ├── main.js        # Game entry point and loop
    ├── input.js       # Keyboard input handling
    ├── gameState.js   # Core game state management
    ├── render.js      # Canvas rendering
    ├── mathEngine.js  # Math question generation
    └── missions.js    # Mission system
```

## Technical Details

- Built with vanilla JavaScript (ES6 modules)
- Uses HTML5 Canvas for rendering
- No external dependencies required
- Runs entirely in the browser

## Future Enhancements

- Sprite-based graphics
- Multiple levels
- More complex math problems
- Sound effects
- Combat system

