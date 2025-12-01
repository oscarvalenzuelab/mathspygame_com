// Input handling system
class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.keysPressed = {}; // Tracks keys that were just pressed (one frame)
        this.actionKeys = new Set(['KeyE', 'Enter', 'Space']); // E, Enter, or Space for actions
        this.mouseX = 0;
        this.mouseY = 0;
        this.mousePressed = false;
        this.mouseJustPressed = false;
        this.onPlayerShot = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            // Prevent default for spacebar to avoid page scrolling
            if (e.code === 'Space') {
                e.preventDefault();
            }
            this.keys[e.code] = true;
            // Mark as just pressed if it wasn't already down
            if (!this.keysPressed[e.code]) {
                this.keysPressed[e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keysPressed[e.code] = false;
        });

        // Mouse events for shooting
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = rect.width ? this.canvas.width / rect.width : 1;
            const scaleY = rect.height ? this.canvas.height / rect.height : 1;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.mousePressed = true;
                this.mouseJustPressed = true;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mousePressed = false;
            }
        });
    }

    isKeyDown(keyCode) {
        return this.keys[keyCode] || false;
    }

    isActionPressed() {
        // Check if any action key was just pressed (one-time event)
        for (const key of this.actionKeys) {
            if (this.keysPressed[key] === true) {
                return true;
            }
        }
        return false;
    }

    isHidePressed() {
        // Toggle hide on key press (not while held)
        return this.keysPressed['KeyH'] === true;
    }

    isShootPressed() {
        return this.mouseJustPressed;
    }

    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }

    // Call this at the end of each frame to clear pressed keys
    clearPressedKeys() {
        // Reset all pressed keys after they've been checked
        Object.keys(this.keysPressed).forEach(key => {
            if (this.keysPressed[key]) {
                this.keysPressed[key] = false;
            }
        });
        this.mouseJustPressed = false;
    }

    resetInputs() {
        this.keys = {};
        this.keysPressed = {};
        this.mousePressed = false;
        this.mouseJustPressed = false;
    }

    getMovementVector() {
        let dx = 0;
        let dy = 0;

        // Arrow keys or WASD
        if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) {
            dx = -1;
        }
        if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) {
            dx = 1;
        }
        if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) {
            dy = -1;
        }
        if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) {
            dy = 1;
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707; // 1/sqrt(2)
            dy *= 0.707;
        }

        return { dx, dy };
    }
}

export default InputManager;
