// Core game state management
import MapSystem from './map.js';
import { LEVEL_SETTINGS } from './gameConfig.js';

class GameState {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.mapSystem = new MapSystem(canvasWidth, canvasHeight, LEVEL_SETTINGS.tileSize);
        
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
        this.stateChangeListener = null;
        this.defeatedEnemies = new Set();
        this.spawnGraceTimer = 0;
        this.missionType = 'defuse_bombs';
    }

    loadLevel(levelData, options = {}) {
        // Load map first
        if (levelData.map) {
            this.mapSystem.loadMap(levelData.map);
        }

        this.missionType = levelData.missionType || 'defuse_bombs';

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
        this.player.health = this.player.maxHealth;
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
        // Reset defeated enemy tracking for fresh level loads unless preserving
        if (!options.preserveDefeated) {
            this.defeatedEnemies = new Set();
        }
        if (options.preserveDefeated && this.defeatedEnemies && this.defeatedEnemies.size > 0) {
            this.enemies = this.enemies.filter(enemy => !this.defeatedEnemies.has(enemy.id));
        }
        this.spawnGraceTimer = 3;

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

    updateProjectiles(deltaTime, inputManager = null) {
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
                    const [removedEnemy] = this.enemies.splice(i, 1);
                    if (removedEnemy?.id) {
                        this.defeatedEnemies.add(removedEnemy.id);
                    }
                    this.score += 50;
                    this.notifyChange();
                    inputManager?.onEnemyHit?.();
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
            if (!this.player.hidden && this.spawnGraceTimer <= 0) {
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
            if (this.spawnGraceTimer <= 0 && this.isColliding(projectile, this.player) && !this.player.invincible) {
                this.player.health -= 15;
                this.player.invincible = true;
                this.player.invincibleTime = 1.0;

                if (this.player.health <= 0) {
                    this.player.health = 0;
                    this.gameOver = true;
                    this.gameOverReason = this.gameOverReason || 'health';
                    this.notifyChange();
                }
                this.notifyChange();
                return false; // Remove projectile
            }

            return true;
        });
    }

    updateMissionTimer(deltaTime) {
        if (!this.timerActive || this.gameOver || this.won || this.isPaused) return;

        this.levelTimer -= deltaTime;

        if (this.levelTimer <= 0) {
            this.levelTimer = 0;
            this.timerActive = false;
            this.timerExpired = true;
            this.gameOver = true;
            this.gameOverReason = 'timer';
            this.notifyChange();
        }
    }

    updateSpawnGrace(deltaTime) {
        if (this.spawnGraceTimer > 0) {
            this.spawnGraceTimer = Math.max(0, this.spawnGraceTimer - deltaTime);
        }
    }

    updateTrapBombs(deltaTime, inputManager) {
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
                this.notifyChange();
                inputManager?.onExplosion?.();
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
                        this.notifyChange();
                    }
                    this.notifyChange();
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
                    this.notifyChange();
                    inputManager.onDoorSuccess?.();
                    return { type: "door_unlocked", door: door };
                } else if (door.requires === "secret" && this.inventory.secrets > 0) {
                    this.inventory.secrets--;
                    door.unlocked = true;
                    this.unlockDoorInMap(door);
                    this.score += 50;
                    this.notifyChange();
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
                (obj.type === 'secret_asset' && obj.collected) ||
                (obj.type === 'vendor' && obj.collected) ||
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
                const requirement = this.evaluateInteractionRequirement(obj);
                if (!requirement.allowed) {
                    if (requirement.type === 'requires_item') {
                        inputManager.onDoorBlocked?.();
                    }
                    return { type: requirement.type, message: requirement.message };
                }
                return obj;
            }
        }

        // Check collectibles (keys, money, etc.)
        for (const collectible of this.collectibles) {
            if (collectible.collected) continue;
            const distance = Math.sqrt(
                Math.pow(this.player.x + this.player.width/2 - (collectible.x + collectible.width/2), 2) +
                Math.pow(this.player.y + this.player.height/2 - (collectible.y + collectible.height/2), 2)
            );
            if (distance < 50 && inputManager.isActionPressed()) {
                return collectible;
            }
        }

        return null;
    }

    evaluateInteractionRequirement(obj) {
        if (!obj.requires) {
            return { allowed: true };
        }

        if (obj.requires === 'intel') {
            if (this.hasIntel) {
                return { allowed: true };
            }
            return {
                allowed: false,
                type: 'requires_intel',
                message: obj.requirementMessage || 'You need the intel briefcase to disarm bombs!'
            };
        }

        if (obj.requires === 'key') {
            if (this.inventory.keys > 0) {
                return { allowed: true };
            }
            return {
                allowed: false,
                type: 'requires_item',
                message: obj.requirementMessage || 'You need a key to use this!'
            };
        }

        if (obj.requires === 'secret') {
            if (this.inventory.secrets > 0) {
                return { allowed: true };
            }
            return {
                allowed: false,
                type: 'requires_item',
                message: obj.requirementMessage || 'You need the secret code to use this!'
            };
        }

        if (obj.requires === 'money') {
            if (this.inventory.money > 0) {
                return { allowed: true };
            }
            return {
                allowed: false,
                type: 'requires_item',
                message: obj.requirementMessage || 'You need more funds to do this!'
            };
        }

        return { allowed: true };
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
        this.notifyChange();
    }

    handleMathAnswer(correct, objectId, inputManager) {
        let obj = this.interactiveObjects.find(o => o.id === objectId);
        let collectibleTarget = null;
        if (!obj) {
            collectibleTarget = this.collectibles.find(c => c.id === objectId);
            if (!collectibleTarget) return;
        }

        if (correct) {
            if (obj) {
                this.consumeRequirementResource(obj);
            }
            if (obj && obj.type === "bomb") {
                obj.solved = true;
                obj.active = false;
                this.score += 100;
            } else if (obj && obj.type === "loot") {
                obj.collected = true;
                obj.active = false;
                if (!obj.grantedSecret) {
                    this.inventory.secrets++;
                    obj.grantedSecret = true;
                }
                this.hasIntel = true;
                this.score += 150;
            } else if (obj && obj.type === 'secret_asset') {
                obj.collected = true;
                obj.active = false;
                this.inventory.secrets++;
                this.hasIntel = true;
                this.score += 175;
            } else if (obj && obj.type === 'vendor') {
                obj.collected = true;
                obj.active = false;
                this.inventory.secrets++;
                this.hasIntel = true;
                this.score += 200;
            } else if (collectibleTarget) {
                this.collectCollectible(collectibleTarget);
                inputManager?.onItemPickup?.();
            }
        } else {
            if (obj) {
                obj.wrongAttempts = (obj.wrongAttempts || 0) + 1;
                if (obj.type === "loot" && obj.wrongAttempts >= 3 && !obj.trapActive) {
                    this.activateTrapBomb(obj);
                }
            }
            // Wrong answer penalty
            this.player.health -= 15;
            if (this.player.health <= 0) {
                this.player.health = 0;
                this.gameOver = true;
                this.gameOverReason = this.gameOverReason || 'health';
            }
        }
        this.notifyChange();
    }

    collectCollectible(collectible) {
        if (!collectible || collectible.collected) return;
        collectible.collected = true;
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
    }

    consumeRequirementResource(obj) {
        if (!obj.consumeRequirement || !obj.requires) return;
        if (obj.requires === 'money' && this.inventory.money > 0) {
            this.inventory.money -= 1;
        } else if (obj.requires === 'key' && this.inventory.keys > 0) {
            this.inventory.keys -= 1;
        } else if (obj.requires === 'secret' && this.inventory.secrets > 0) {
            this.inventory.secrets -= 1;
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    setChangeListener(listener) {
        this.stateChangeListener = listener;
    }

    notifyChange() {
        if (typeof this.stateChangeListener === 'function') {
            this.stateChangeListener();
        }
    }

    getSaveData() {
        return {
            player: {
                x: this.player.x,
                y: this.player.y,
                health: this.player.health,
                hidden: this.player.hidden,
                hideUsed: this.player.hideUsed,
                hideTimeRemaining: this.player.hideTimeRemaining
            },
            inventory: { ...this.inventory },
            score: this.score,
            doors: this.doors.map(door => ({ id: door.id, unlocked: door.unlocked })),
            interactiveObjects: this.interactiveObjects.map(obj => ({
                id: obj.id,
                type: obj.type,
                active: obj.active,
                solved: obj.solved,
                collected: obj.collected,
                wrongAttempts: obj.wrongAttempts,
                trapActive: obj.trapActive,
                trapTimer: obj.trapTimer,
                exploded: obj.exploded,
                grantedSecret: obj.grantedSecret
            })),
            collectibles: this.collectibles.map(collectible => ({ id: collectible.id, collected: collectible.collected })),
            defeatedEnemyIds: Array.from(this.defeatedEnemies),
            hasIntel: this.hasIntel,
            levelTimer: this.levelTimer,
            timerActive: this.timerActive,
            timerExpired: this.timerExpired,
            spawnGraceTimer: this.spawnGraceTimer
        };
    }

    applySaveData(data) {
        if (!data) return;

        if (data.player) {
            this.player.x = data.player.x ?? this.player.x;
            this.player.y = data.player.y ?? this.player.y;
            if (typeof data.player.health === 'number') {
                this.player.health = Math.max(0, Math.min(this.player.maxHealth, data.player.health));
            }
            this.player.hidden = !!data.player.hidden;
            this.player.hideUsed = !!data.player.hideUsed;
            this.player.hideTimeRemaining = data.player.hideTimeRemaining ?? this.player.hideTimeRemaining;
        }

        if (data.inventory) {
            this.inventory = {
                keys: data.inventory.keys ?? this.inventory.keys,
                money: data.inventory.money ?? this.inventory.money,
                secrets: data.inventory.secrets ?? this.inventory.secrets
            };
        }

        if (typeof data.score === 'number') {
            this.score = data.score;
        }

        if (Array.isArray(data.doors)) {
            data.doors.forEach(savedDoor => {
                const door = this.doors.find(d => d.id === savedDoor.id);
                if (door) {
                    door.unlocked = !!savedDoor.unlocked;
                    if (door.unlocked) {
                        this.unlockDoorInMap(door);
                    }
                }
            });
        }

        if (Array.isArray(data.interactiveObjects)) {
            data.interactiveObjects.forEach(savedObj => {
                const obj = this.interactiveObjects.find(o => o.id === savedObj.id);
                if (obj) {
                    if (savedObj.type) obj.type = savedObj.type;
                    if (typeof savedObj.active === 'boolean') obj.active = savedObj.active;
                    if (typeof savedObj.solved === 'boolean') obj.solved = savedObj.solved;
                    if (typeof savedObj.collected === 'boolean') obj.collected = savedObj.collected;
                    if (typeof savedObj.wrongAttempts === 'number') obj.wrongAttempts = savedObj.wrongAttempts;
                    if (typeof savedObj.trapActive === 'boolean') obj.trapActive = savedObj.trapActive;
                    if (typeof savedObj.trapTimer === 'number') obj.trapTimer = savedObj.trapTimer;
                    if (typeof savedObj.exploded === 'boolean') obj.exploded = savedObj.exploded;
                    if (typeof savedObj.grantedSecret === 'boolean') obj.grantedSecret = savedObj.grantedSecret;
                }
            });
        }

        if (Array.isArray(data.collectibles)) {
            data.collectibles.forEach(savedCollectible => {
                const collectible = this.collectibles.find(c => c.id === savedCollectible.id);
                if (collectible && typeof savedCollectible.collected === 'boolean') {
                    collectible.collected = savedCollectible.collected;
                }
            });
        }

        if (Array.isArray(data.defeatedEnemyIds)) {
            this.defeatedEnemies = new Set(data.defeatedEnemyIds);
            if (this.defeatedEnemies.size > 0) {
                this.enemies = this.enemies.filter(enemy => !this.defeatedEnemies.has(enemy.id));
            }
        } else {
            this.defeatedEnemies = new Set();
        }

        if (typeof data.hasIntel === 'boolean') {
            this.hasIntel = data.hasIntel;
        }

        if (typeof data.levelTimer === 'number') {
            this.levelTimer = data.levelTimer;
        }
        if (typeof data.timerActive === 'boolean') {
            this.timerActive = data.timerActive;
        }
        if (typeof data.timerExpired === 'boolean') {
            this.timerExpired = data.timerExpired;
        }
        if (typeof data.spawnGraceTimer === 'number') {
            this.spawnGraceTimer = Math.max(0, data.spawnGraceTimer);
        }

        this.notifyChange();
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
        this.defeatedEnemies = new Set();
        this.spawnGraceTimer = 0;
    }
}

export default GameState;
