// Core game state management
import MapSystem from './map.js';

class GameState {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.mapSystem = new MapSystem(canvasWidth, canvasHeight);
        
        // Player
        this.player = {
            x: 50,
            y: 50,
            width: 30,
            height: 30,
            speed: 200, // pixels per second
            health: 100,
            maxHealth: 100,
            invincible: false,
            invincibleTime: 0,
            // Hide/stealth mechanics (one-time use, 5 seconds)
            hidden: false,
            hideUsed: false,
            hideTimeRemaining: 0
        };

        // Inventory
        this.inventory = {
            keys: 0,
            money: 0,
            secrets: 0
        };

        // Enemies
        this.enemies = [];
        
        // Enemy projectiles
        this.enemyProjectiles = [];

        // Interactive objects
        this.interactiveObjects = [];

        // Doors (locked areas)
        this.doors = [];

        // Collectibles
        this.collectibles = [];

        // Projectiles (bullets)
        this.projectiles = [];

        // Game state
        this.score = 0;
        this.isPaused = false;
        this.currentMathQuestion = null;
        this.gameOver = false;
        this.won = false;
        this.currentLevel = 1;
        this.hideKeyPressed = false; // Track hide key state for toggle
        this.levelTimeLimit = 120;
        this.levelTimer = this.levelTimeLimit;
        this.timerActive = false;
        this.timerExpired = false;
        this.gameOverReason = null;
        this.hasIntel = false;
    }

    loadLevel(levelData) {
        // Load map first
        if (levelData.map) {
            this.mapSystem.loadMap(levelData.map);
        }

        // Initialize timer (default 2 minutes unless level overrides)
        this.levelTimeLimit = levelData.timeLimit || 120;
        this.levelTimer = this.levelTimeLimit;
        this.timerActive = true;
        this.timerExpired = false;
        this.gameOverReason = null;

        // Reset player position - ensure it's on a valid tile
        const validPos = this.mapSystem.getValidPosition(
            levelData.playerStart.x,
            levelData.playerStart.y,
            this.player.width,
            this.player.height
        );
        this.player.x = validPos.x;
        this.player.y = validPos.y;
        this.player.health = 100;
        this.player.invincible = false;
        this.player.invincibleTime = 0;
        // Reset hide for new level
        this.player.hidden = false;
        this.player.hideUsed = false;
        this.player.hideTimeRemaining = 0;

        // Load enemies
        this.enemies = levelData.enemies.map(enemy => {
            const validEnemyPos = this.mapSystem.getValidPosition(
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );
            return { ...enemy, x: validEnemyPos.x, y: validEnemyPos.y };
        });

        // Load interactive objects
        this.interactiveObjects = levelData.interactiveObjects.map(obj => {
            const validObjPos = this.mapSystem.getValidPosition(
                obj.x,
                obj.y,
                obj.width,
                obj.height
            );
            return {
                ...obj,
                x: validObjPos.x,
                y: validObjPos.y,
                wrongAttempts: 0,
                trapActive: false,
                trapTimer: 0,
                exploded: false,
                explosionRadius: this.mapSystem.tileSize * 5,
                grantedSecret: false
            };
        });

        // Load collectibles
        this.collectibles = levelData.collectibles.map(collectible => {
            const validCollectiblePos = this.mapSystem.getValidPosition(
                collectible.x,
                collectible.y,
                collectible.width,
                collectible.height
            );
            return { ...collectible, x: validCollectiblePos.x, y: validCollectiblePos.y };
        });

        // Load doors
        if (levelData.doors && levelData.doors.length > 0) {
            this.doors = levelData.doors.map(door => {
                // Mark the tiles occupied by the door as locked so they block movement
                this.mapSystem.setTilesInRect(door.x, door.y, door.width, door.height, 'door_locked');
                return { ...door, unlocked: false };
            });
        } else {
            this.doors = [];
        }

        this.hasIntel = false;

        // Clear projectiles when loading new level
        this.projectiles = [];
        this.enemyProjectiles = [];
    }

    updatePlayer(deltaTime, movementVector, inputManager) {
        if (this.isPaused || this.gameOver || this.won) return;

        // Horizontal movement with wall collision
        if (movementVector.dx !== 0) {
            const newX = this.player.x + movementVector.dx * this.player.speed * deltaTime;
            const testRectX = { x: newX, y: this.player.y, width: this.player.width, height: this.player.height };
            
            if (!this.mapSystem.checkCollision(testRectX)) {
                const clampedX = Math.max(0, Math.min(this.canvasWidth - this.player.width, newX));
                this.player.x = clampedX;
            }
        }

        // Vertical movement with wall collision
        if (movementVector.dy !== 0) {
            const newY = this.player.y + movementVector.dy * this.player.speed * deltaTime;
            const testRectY = { x: this.player.x, y: newY, width: this.player.width, height: this.player.height };
            
            if (!this.mapSystem.checkCollision(testRectY)) {
                const clampedY = Math.max(0, Math.min(this.canvasHeight - this.player.height, newY));
                this.player.y = clampedY;
            }
        }

        // Hide/stealth mechanics (one-time use, 5 seconds)
        const hidePressed = inputManager.isHidePressed();
        if (hidePressed && !this.hideKeyPressed && !this.player.hideUsed) {
            // Key just pressed - activate hide (only if not already used)
            this.player.hidden = true;
            this.player.hideUsed = true;
            this.player.hideTimeRemaining = 5.0; // 5 seconds
            this.hideKeyPressed = true;
        } else if (!hidePressed) {
            // Key released - reset flag
            this.hideKeyPressed = false;
        }

        // Update hide timer
        if (this.player.hidden && this.player.hideTimeRemaining > 0) {
            this.player.hideTimeRemaining -= deltaTime;
            if (this.player.hideTimeRemaining <= 0) {
                // Auto-unhide after 5 seconds
                this.player.hidden = false;
                this.player.hideTimeRemaining = 0;
            }
        }

        // Shooting
        if (inputManager.isShootPressed() && !this.player.hidden) {
            const mousePos = inputManager.getMousePosition();
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            
            const dx = mousePos.x - playerCenterX;
            const dy = mousePos.y - playerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const speed = 500; // pixels per second
                this.projectiles.push({
                    x: playerCenterX,
                    y: playerCenterY,
                    vx: (dx / distance) * speed,
                    vy: (dy / distance) * speed,
                    width: 5,
                    height: 5,
                    life: 2.0 // 2 seconds max lifetime
                });
                inputManager.onPlayerShot?.();
            }
        }
    }

    updateProjectiles(deltaTime) {
        if (this.isPaused || this.gameOver || this.won) return;

        this.projectiles = this.projectiles.filter(projectile => {
            // Update position
            projectile.x += projectile.vx * deltaTime;
            projectile.y += projectile.vy * deltaTime;
            projectile.life -= deltaTime;

            // Remove if out of bounds or expired
            if (projectile.life <= 0 ||
                projectile.x < 0 || projectile.x > this.canvasWidth ||
                projectile.y < 0 || projectile.y > this.canvasHeight) {
                return false;
            }

            // Check collision with walls
            if (this.mapSystem.checkCollision(projectile)) {
                return false; // Remove projectile on wall hit
            }

            // Check collision with enemies
            for (let i = 0; i < this.enemies.length; i++) {
                const enemy = this.enemies[i];
                if (this.isColliding(projectile, enemy)) {
                    // Remove enemy (or damage it)
                    this.enemies.splice(i, 1);
                    this.score += 50;
                    return false; // Remove projectile
                }
            }

            return true;
        });
    }

    updateEnemies(deltaTime) {
        if (this.isPaused || this.gameOver || this.won) return;

        this.enemies.forEach(enemy => {
            // Patrol AI - supports both X and Y axis
            const axis = enemy.patrolAxis || "x";
            const speed = enemy.direction * enemy.speed * deltaTime;

            let newX = enemy.x;
            let newY = enemy.y;

            if (axis === "x") {
                newX += speed;
                const testRect = { x: newX, y: enemy.y, width: enemy.width, height: enemy.height };
                
                if (!this.mapSystem.checkCollision(testRect) && newX >= enemy.patrolStart && newX <= enemy.patrolEnd) {
                    enemy.x = newX;
                } else {
                    enemy.direction *= -1;
                }
            } else {
                newY += speed;
                const testRect = { x: enemy.x, y: newY, width: enemy.width, height: enemy.height };
                
                if (!this.mapSystem.checkCollision(testRect) && newY >= enemy.patrolStart && newY <= enemy.patrolEnd) {
                    enemy.y = newY;
                } else {
                    enemy.direction *= -1;
                }
            }

            // Check if enemy can see player (and player is not hidden)
            if (!this.player.hidden) {
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                
                const dx = playerCenterX - enemyCenterX;
                const dy = playerCenterY - enemyCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const hasLineOfSight = this.mapSystem.hasLineOfSight(enemyCenterX, enemyCenterY, playerCenterX, playerCenterY);
                
                // Enemy can see player if within range (300 pixels)
                if (distance < 300 && distance > 0 && hasLineOfSight) {
                    // Check if enemy should shoot (cooldown system)
                    if (!enemy.lastShotTime) enemy.lastShotTime = 0;
                    const timeSinceLastShot = Date.now() / 1000 - enemy.lastShotTime;

                    if (timeSinceLastShot > 1.5) { // Shoot every 1.5 seconds
                        const speed = 300; // Enemy bullet speed
                        this.enemyProjectiles.push({
                            x: enemyCenterX,
                            y: enemyCenterY,
                            vx: (dx / distance) * speed,
                            vy: (dy / distance) * speed,
                            width: 5,
                            height: 5,
                            life: 3.0 // 3 seconds max lifetime
                        });
                        enemy.lastShotTime = Date.now() / 1000;
                    }
                }
            }
        });
    }

    updateEnemyProjectiles(deltaTime) {
        if (this.isPaused || this.gameOver || this.won) return;

        this.enemyProjectiles = this.enemyProjectiles.filter(projectile => {
            // Update position
            projectile.x += projectile.vx * deltaTime;
            projectile.y += projectile.vy * deltaTime;
            projectile.life -= deltaTime;

            // Remove if out of bounds or expired
            if (projectile.life <= 0 ||
                projectile.x < 0 || projectile.x > this.canvasWidth ||
                projectile.y < 0 || projectile.y > this.canvasHeight) {
                return false;
            }

            // Check collision with walls
            if (this.mapSystem.checkCollision(projectile)) {
                return false;
            }

            // Check collision with player
            if (this.isColliding(projectile, this.player) && !this.player.invincible) {
                this.player.health -= 15;
                this.player.invincible = true;
                this.player.invincibleTime = 1.0;

                if (this.player.health <= 0) {
                    this.player.health = 0;
                    this.gameOver = true;
                    this.gameOverReason = this.gameOverReason || 'health';
                }
                return false; // Remove projectile
            }

            return true;
        });
    }

    updateMissionTimer(deltaTime) {
        if (!this.timerActive || this.gameOver || this.won) return;

        this.levelTimer -= deltaTime;

        if (this.levelTimer <= 0) {
            this.levelTimer = 0;
            this.timerActive = false;
            this.timerExpired = true;
            this.gameOver = true;
            this.gameOverReason = 'timer';
        }
    }

    updateTrapBombs(deltaTime) {
        if (this.isPaused || this.gameOver || this.won) return;

        this.interactiveObjects.forEach(obj => {
            if (obj.type !== 'trap_bomb' || !obj.trapActive || obj.exploded) {
                return;
            }

            // Sync trap timer to the global mission timer so it reflects the real bomb countdown
            obj.trapTimer = this.levelTimer;

            if ((this.timerExpired || obj.trapTimer <= 0) && !obj.exploded) {
                obj.trapActive = false;
                obj.exploded = true;
                obj.active = false;

                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                const bombCenterX = obj.x + obj.width / 2;
                const bombCenterY = obj.y + obj.height / 2;
                const dx = playerCenterX - bombCenterX;
                const dy = playerCenterY - bombCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const radius = obj.explosionRadius || this.mapSystem.tileSize * 5;

                let killedByBlast = false;
                if (distance <= radius) {
                    this.player.health = 0;
                    killedByBlast = true;
                }

                this.gameOver = true;
                this.gameOverReason = killedByBlast ? 'trap_bomb' : 'timer';
                inputManager.onExplosion?.();
            }
        });
    }

    checkCollectibles(inputManager) {
        if (this.isPaused || this.gameOver || this.won) return;

        this.collectibles.forEach(collectible => {
            if (collectible.collected) return;

            // Check if player is near collectible and presses action key
            const distance = Math.sqrt(
                Math.pow(this.player.x + this.player.width/2 - (collectible.x + collectible.width/2), 2) +
                Math.pow(this.player.y + this.player.height/2 - (collectible.y + collectible.height/2), 2)
            );

            if (distance < 50 && inputManager.isActionPressed()) {
                collectible.collected = true;
                
                // Add to inventory
                if (collectible.type === "key") {
                    this.inventory.keys++;
                    this.score += 25;
                } else if (collectible.type === "money") {
                    this.inventory.money++;
                    this.score += 10;
                } else if (collectible.type === "secret") {
                    this.inventory.secrets++;
                    this.score += 50;
                } else if (collectible.type === "health") {
                    const healAmount = Math.round(this.player.maxHealth * 0.1);
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount);
                    this.score += 5;
                }
                inputManager.onItemPickup?.();
            }
        });
    }

    checkCollisions() {
        if (this.isPaused || this.gameOver || this.won) return;

        // Player vs Enemies (only if not hidden)
        if (!this.player.hidden) {
            this.enemies.forEach(enemy => {
                if (this.isColliding(this.player, enemy) && !this.player.invincible) {
                    this.player.health -= 10;
                    this.player.invincible = true;
                    this.player.invincibleTime = 1.0; // 1 second invincibility

                    if (this.player.health <= 0) {
                        this.player.health = 0;
                        this.gameOver = true;
                        this.gameOverReason = this.gameOverReason || 'health';
                    }
                }
            });
        }

        // Update invincibility timer
        if (this.player.invincible) {
            this.player.invincibleTime -= 0.016; // ~60fps
            if (this.player.invincibleTime <= 0) {
                this.player.invincible = false;
            }
        }
    }

    checkInteractions(inputManager) {
        if (this.isPaused || this.gameOver || this.won) return null;

        // Check if player is near a door
        for (const door of this.doors) {
            if (door.unlocked) continue;

            const distance = Math.sqrt(
                Math.pow(this.player.x + this.player.width/2 - (door.x + door.width/2), 2) +
                Math.pow(this.player.y + this.player.height/2 - (door.y + door.height/2), 2)
            );

            if (distance < 50 && inputManager.isActionPressed()) {
                // Check if player has required key/secret
                if (door.requires === "key" && this.inventory.keys > 0) {
                    this.inventory.keys--;
                    door.unlocked = true;
                    this.unlockDoorInMap(door);
                    this.score += 25;
                    inputManager.onDoorSuccess?.();
                    return { type: "door_unlocked", door: door };
                } else if (door.requires === "secret" && this.inventory.secrets > 0) {
                    this.inventory.secrets--;
                    door.unlocked = true;
                    this.unlockDoorInMap(door);
                    this.score += 50;
                    inputManager.onDoorSuccess?.();
                    return { type: "door_unlocked", door: door };
                } else if (door.requires === "key" && this.inventory.keys === 0) {
                    inputManager.onDoorBlocked?.();
                    return { type: "door_locked", message: "You need a key to unlock this door!" };
                } else if (door.requires === "secret" && this.inventory.secrets === 0) {
                    inputManager.onDoorBlocked?.();
                    return { type: "door_locked", message: "You need a secret combination to unlock this door!" };
                }
            }
        }

        // Check if player is near an interactive object
        for (const obj of this.interactiveObjects) {
            if (!obj.active || (obj.type === "bomb" && obj.solved) || 
                (obj.type === "loot" && obj.collected) ||
                obj.type === "trap_bomb") {
                continue;
            }

            // Check if player is close enough (within interaction range)
            const distance = Math.sqrt(
                Math.pow(this.player.x + this.player.width/2 - (obj.x + obj.width/2), 2) +
                Math.pow(this.player.y + this.player.height/2 - (obj.y + obj.height/2), 2)
            );

            // Check if player is close and action key was just pressed
            if (distance < 50 && inputManager.isActionPressed()) {
                if (obj.type === 'bomb' && !this.hasIntel) {
                    return { type: 'requires_intel', message: 'You need the intel briefcase to disarm bombs!' };
                }
                return obj;
            }
        }

        return null;
    }

    unlockDoorInMap(door) {
        // Mark the door tiles as unlocked so they become passable and render as open
        this.mapSystem.setTilesInRect(door.x, door.y, door.width, door.height, 'door_unlocked');

        // Also clear the immediate neighboring wall tiles so the doorway has enough clearance,
        // especially when the door sits on a corner intersection of walls
        const tileSize = this.mapSystem.tileSize;
        const startTileX = Math.floor(door.x / tileSize);
        const endTileX = Math.floor((door.x + door.width - 1) / tileSize);
        const startTileY = Math.floor(door.y / tileSize);
        const endTileY = Math.floor((door.y + door.height - 1) / tileSize);

        const expandOffsets = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 }
        ];

        for (let tileY = startTileY; tileY <= endTileY; tileY++) {
            for (let tileX = startTileX; tileX <= endTileX; tileX++) {
                expandOffsets.forEach(({ dx, dy }) => {
                    const nx = tileX + dx;
                    const ny = tileY + dy;
                    if (ny >= 0 && ny < this.mapSystem.mapHeight &&
                        nx >= 0 && nx < this.mapSystem.mapWidth &&
                        this.mapSystem.tiles[ny] &&
                        this.mapSystem.tiles[ny][nx] === 'wall') {
                        this.mapSystem.tiles[ny][nx] = 'floor';
                    }
                });
            }
        }
    }

    activateTrapBomb(obj) {
        obj.type = 'trap_bomb';
        obj.trapActive = true;
        obj.trapDuration = this.levelTimeLimit;
        obj.trapTimer = this.levelTimer;
        obj.exploded = false;
        obj.active = true; // We still want to render it, but it should no longer be interactable
        obj.explosionRadius = obj.explosionRadius || this.mapSystem.tileSize * 5;
    }

    handleMathAnswer(correct, objectId) {
        const obj = this.interactiveObjects.find(o => o.id === objectId);
        if (!obj) return;

        if (correct) {
            if (obj.type === "bomb") {
                obj.solved = true;
                obj.active = false;
                this.score += 100;
            } else if (obj.type === "loot") {
                obj.collected = true;
                obj.active = false;
                if (!obj.grantedSecret) {
                    this.inventory.secrets++;
                    obj.grantedSecret = true;
                }
                this.hasIntel = true;
                this.score += 150;
            }
        } else {
            obj.wrongAttempts = (obj.wrongAttempts || 0) + 1;
            if (obj.type === "loot" && obj.wrongAttempts >= 3 && !obj.trapActive) {
                this.activateTrapBomb(obj);
            }
            // Wrong answer penalty
            this.player.health -= 15;
            if (this.player.health <= 0) {
                this.player.health = 0;
                this.gameOver = true;
                this.gameOverReason = this.gameOverReason || 'health';
            }
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    reset() {
        this.player.x = 50;
        this.player.y = 50;
        this.player.health = 100;
        this.player.invincible = false;
        this.player.invincibleTime = 0;
        this.score = 0;
        this.isPaused = false;
        this.currentMathQuestion = null;
        this.gameOver = false;
        this.won = false;
        this.currentLevel = 1;
        this.inventory = { keys: 0, money: 0, secrets: 0 };

        // Reset interactive objects
        this.interactiveObjects.forEach(obj => {
            obj.active = true;
            if (obj.type === "bomb") obj.solved = false;
            if (obj.type === "loot") {
                obj.collected = false;
                obj.grantedSecret = false;
            }
        });

        // Reset collectibles
        this.collectibles.forEach(collectible => {
            collectible.collected = false;
        });

        // Reset player mechanics
        this.player.hidden = false;
        this.player.hideUsed = false;
        this.player.hideTimeRemaining = 0;
        this.hideKeyPressed = false;

        // Clear projectiles
        this.projectiles = [];
        this.enemyProjectiles = [];

        // Reset timer state (will be set when level loads)
        this.levelTimer = this.levelTimeLimit;
        this.timerActive = false;
        this.timerExpired = false;
        this.gameOverReason = null;
        this.hasIntel = false;
    }
}

export default GameState;
