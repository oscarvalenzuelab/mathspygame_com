import { ICON_CONFIG } from './gameConfig.js';

// Rendering system for canvas with Bootstrap Icons
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entityContainer = null;
        this.entitiesDrawnThisFrame = new Set();
        this.displayScale = 1;
        this.mapDrawnOnce = false;
        this.setupEntityContainer();
    }

    setupEntityContainer() {
        // Create container for HTML entity elements
        const container = document.getElementById('game-container');
        if (!container) return;
        
        // Remove old container if exists
        const oldContainer = document.getElementById('entity-container');
        if (oldContainer) oldContainer.remove();
        
        // Create new container
        this.entityContainer = document.createElement('div');
        this.entityContainer.id = 'entity-container';
        this.entityContainer.style.position = 'absolute';
        this.entityContainer.style.top = '0';
        this.entityContainer.style.left = '0';
        const width = this.canvas.clientWidth || this.canvas.width;
        const height = this.canvas.clientHeight || this.canvas.height;
        this.entityContainer.style.width = width + 'px';
        this.entityContainer.style.height = height + 'px';
        this.entityContainer.style.pointerEvents = 'none';
        this.entityContainer.style.overflow = 'hidden';
        this.displayScale = this.canvas.width ? width / this.canvas.width : 1;
        container.appendChild(this.entityContainer);
    }

    setDisplaySize(width, height, scale = 1) {
        this.displayScale = scale;
        if (this.entityContainer) {
            this.entityContainer.style.width = width + 'px';
            this.entityContainer.style.height = height + 'px';
        }
    }

    createOrUpdateEntity(id, icon, x, y, size, color, rotation = 0, opacity = 1) {
        const elementId = `entity-${id}`;
        let element = document.getElementById(elementId);
        
        if (!element) {
            element = document.createElement('i');
            element.id = elementId;
            element.className = `bi ${icon}`;
            element.style.position = 'absolute';
            element.style.pointerEvents = 'none';
            element.style.fontSize = size + 'px';
            this.entityContainer.appendChild(element);
        }
        
        element.className = `bi ${icon}`;
        const scale = this.displayScale || 1;
        const scaledSize = size * scale;
        const scaledLeft = (x - size / 2) * scale;
        const scaledTop = (y - size / 2) * scale;
        element.style.left = scaledLeft + 'px';
        element.style.top = scaledTop + 'px';
        element.style.color = color;
        element.style.opacity = opacity;
        element.style.transform = `rotate(${rotation}deg)`;
        element.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        element.style.fontSize = scaledSize + 'px';
        element.style.zIndex = '10';
        
        if (this.entitiesDrawnThisFrame) {
            this.entitiesDrawnThisFrame.add(elementId);
        }

        return element;
    }

    removeEntity(id) {
        const element = document.getElementById(`entity-${id}`);
        if (element) element.remove();
    }

    clearEntities() {
        if (this.entityContainer) {
            this.entityContainer.innerHTML = '';
        }
    }

    clear() {
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawMap(mapSystem) {
        const tileSize = mapSystem.tileSize;

        if (!mapSystem.tiles || mapSystem.tiles.length === 0) {
            console.error('No tiles in mapSystem!', mapSystem);
            return;
        }

        if (!this.mapDrawnOnce) {
            console.log('Drawing map for first time:', {
                mapWidth: mapSystem.mapWidth,
                mapHeight: mapSystem.mapHeight,
                tileSize: tileSize,
                tilesLength: mapSystem.tiles.length,
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height
            });
            this.mapDrawnOnce = true;
        }

        for (let y = 0; y < mapSystem.mapHeight; y++) {
            for (let x = 0; x < mapSystem.mapWidth; x++) {
                const tileX = x * tileSize;
                const tileY = y * tileSize;
                const tile = mapSystem.tiles[y][x];

                if (tile === 'wall') {
                    // Draw wall
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(tileX, tileY, tileSize, tileSize);
                    
                    // Wall border
                    this.ctx.strokeStyle = '#333';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(tileX, tileY, tileSize, tileSize);
                    
                    // Wall pattern
                    this.ctx.fillStyle = '#555';
                    this.ctx.fillRect(tileX + 2, tileY + 2, tileSize - 4, tileSize - 4);
                } else if (tile === 'obstacle') {
                    // Draw obstacle (crate/box)
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(tileX + 2, tileY + 2, tileSize - 4, tileSize - 4);
                    
                    // Crate border
                    this.ctx.strokeStyle = '#654321';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(tileX + 2, tileY + 2, tileSize - 4, tileSize - 4);
                    
                    // Crate straps
                    this.ctx.strokeStyle = '#654321';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(tileX + 5, tileY + tileSize / 2);
                    this.ctx.lineTo(tileX + tileSize - 5, tileY + tileSize / 2);
                    this.ctx.moveTo(tileX + tileSize / 2, tileY + 5);
                    this.ctx.lineTo(tileX + tileSize / 2, tileY + tileSize - 5);
                    this.ctx.stroke();
                } else if (tile === 'door_locked') {
                    // Draw locked door
                    this.ctx.fillStyle = '#654321';
                    this.ctx.fillRect(tileX, tileY, tileSize, tileSize);
                    
                    // Door frame
                    this.ctx.strokeStyle = '#8B4513';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(tileX + 2, tileY + 2, tileSize - 4, tileSize - 4);
                    
                    // Lock icon
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.beginPath();
                    this.ctx.arc(tileX + tileSize / 2, tileY + tileSize / 2, tileSize * 0.15, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillRect(tileX + tileSize / 2 - tileSize * 0.1, tileY + tileSize / 2, tileSize * 0.2, tileSize * 0.15);
                } else if (tile === 'door_unlocked') {
                    // Draw unlocked door (open passage)
                    this.ctx.fillStyle = '#3a3a3a';
                    this.ctx.fillRect(tileX, tileY, tileSize, tileSize);
                    
                    // Door frame (lighter to show it's open)
                    this.ctx.strokeStyle = '#4a4a4a';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(tileX, tileY, tileSize, tileSize);
                } else {
                    // Draw floor
                    this.ctx.fillStyle = '#3a3a3a';
                    this.ctx.fillRect(tileX, tileY, tileSize, tileSize);
                    
                    // Floor pattern (subtle grid)
                    this.ctx.strokeStyle = '#2a2a2a';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(tileX, tileY, tileSize, tileSize);
                }
            }
        }
    }

    drawDoor(door) {
        if (door.unlocked) {
            this.removeEntity(`door-${door.id}`);
            return; // Don't draw unlocked doors (they're part of the map now)
        }

        const centerX = door.x + door.width / 2;
        const centerY = door.y + door.height / 2;
        const size = 36;
        this.createOrUpdateEntity(`door-${door.id}`, ICON_CONFIG.door, centerX, centerY, size, '#ffd700');
    }

    drawPlayer(player) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const size = 32;
        
        if (player.hidden) {
            // Draw hidden player with low opacity
            this.createOrUpdateEntity('player', 'bi-person-fill', centerX, centerY, size, '#4CAF50', 0, 0.3);
        } else {
            // Draw visible player
            const color = player.invincible && Math.floor(Date.now() / 100) % 2 === 0 ? '#ff6b6b' : '#4a90e2';
            this.createOrUpdateEntity('player', ICON_CONFIG.player, centerX, centerY, size, color);
        }
    }

    drawEnemy(enemy) {
        const centerX = enemy.x + enemy.width / 2;
        const centerY = enemy.y + enemy.height / 2;
        const size = 28;
        this.createOrUpdateEntity(`enemy-${enemy.id}`, ICON_CONFIG.enemy, centerX, centerY, size, '#e74c3c');
    }

    drawInteractiveObject(obj) {
        if (!obj.active) return;

        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        const size = 30;

        if (obj.type === "bomb") {
            const color = obj.solved ? '#777' : '#ff4d4d';
            const iconSize = obj.solved ? size : size + Math.sin(Date.now() / 200) * 4;
            this.createOrUpdateEntity(`obj-${obj.id}`, ICON_CONFIG.bomb, centerX, centerY, iconSize, color);
        } else if (obj.type === "loot") {
            if (obj.collected) {
                this.removeEntity(`obj-${obj.id}`);
                return; // Don't draw collected items
            }
            // Intel briefcase (gold)
            this.createOrUpdateEntity(`obj-${obj.id}`, ICON_CONFIG.loot, centerX, centerY, size, '#f39c12');
        } else if (obj.type === "trap_bomb") {
            if (obj.exploded) {
                this.removeEntity(`obj-${obj.id}`);
                return;
            }

            this.removeEntity(`obj-${obj.id}`);
            const pulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;
            const bombSize = (size + 12) * pulse;
            this.drawExplosionRadiusIndicator(centerX, centerY, obj.explosionRadius);
            this.drawPulseWarning(centerX, centerY, bombSize, pulse);
            this.createOrUpdateEntity(`obj-${obj.id}`, ICON_CONFIG.bomb, centerX, centerY, bombSize, '#ff5252');

            // Draw countdown text above the trap bomb
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            const remaining = Math.max(0, Math.ceil(obj.trapTimer));
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            const timerText = obj.trapActive ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '0:00';
            this.ctx.fillText(timerText, centerX, centerY - obj.height);
        }
    }

    drawExplosionRadiusIndicator(centerX, centerY, radius) {
        if (!radius) return;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 82, 82, 0.08)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 82, 82, 0.4)';
        this.ctx.setLineDash([10, 8]);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawPulseWarning(centerX, centerY, size, pulse) {
        const glowRadius = size * (1.2 + 0.3 * Math.sin(Date.now() / 100));
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        const gradient = this.ctx.createRadialGradient(centerX, centerY, glowRadius * 0.2, centerX, centerY, glowRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        gradient.addColorStop(1, 'rgba(255, 64, 64, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.restore();
    }

    drawCollectible(collectible) {
        if (collectible.collected) {
            this.removeEntity(`collectible-${collectible.id}`);
            return;
        }

        const centerX = collectible.x + collectible.width / 2;
        const centerY = collectible.y + collectible.height / 2;
        const size = 24;

        if (collectible.type === "key") {
            this.createOrUpdateEntity(`collectible-${collectible.id}`, ICON_CONFIG.key, centerX, centerY, size, '#ffd700');
        } else if (collectible.type === "money") {
            this.createOrUpdateEntity(`collectible-${collectible.id}`, ICON_CONFIG.money, centerX, centerY, size, '#4CAF50');
        } else if (collectible.type === "secret") {
            this.createOrUpdateEntity(`collectible-${collectible.id}`, ICON_CONFIG.secret, centerX, centerY, size, '#9c27b0');
        } else if (collectible.type === "health") {
            this.createOrUpdateEntity(`collectible-${collectible.id}`, ICON_CONFIG.health, centerX, centerY, size, '#ff5252');
        }
    }

    drawInteractionHint(x, y) {
        // Draw a hint that player can interact
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press E or Space', x, y - 10);
    }

    drawCollectibleInfo(collectible, x, y) {
        const info = this.getCollectibleDescription(collectible);
        if (!info) return;
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 1;
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        const padding = 6;
        const width = Math.max(120, this.ctx.measureText(info).width + padding * 2);
        const height = 28;
        this.ctx.fillRect(x - width/2, y - height, width, height);
        this.ctx.strokeRect(x - width/2, y - height, width, height);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(info, x, y - height/2 + 4);
        this.ctx.restore();
    }

    getCollectibleDescription(collectible) {
        switch (collectible.type) {
            case 'key':
                return 'Key: unlocks locked doors';
            case 'money':
                return 'Cash: bonus points';
            case 'secret':
                return 'Code: needed for secret doors';
            case 'health':
                return 'Medkit: restore 10% health';
            default:
                return null;
        }
    }

    drawInteractiveInfo(obj, x, y) {
        const label = this.getInteractiveDescription(obj);
        if (!label) return;
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 1;
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        const padding = 6;
        const width = Math.max(140, this.ctx.measureText(label).width + padding * 2);
        const height = 26;
        this.ctx.fillRect(x - width/2, y - height, width, height);
        this.ctx.strokeRect(x - width/2, y - height, width, height);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(label, x, y - height/2 + 3);
        this.ctx.restore();
    }

    getInteractiveDescription(obj) {
        if (obj.type === 'loot' && !obj.collected) {
            return 'Intel: collect to disarm bombs';
        }
        if (obj.type === 'bomb' && !obj.solved) {
            return 'Bomb: E + solve math';
        }
        return null;
    }

    drawDoorRequirementHint(door, x, y) {
        const requirementText = door.requires === 'secret' ? 'Requires CODE' : 'Requires KEY';
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 1;
        const width = 120;
        const height = 34;
        this.ctx.fillRect(x - width/2, y - height, width, height);
        this.ctx.strokeRect(x - width/2, y - height, width, height);
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(requirementText, x, y - 18);
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillText('Press E / Space', x, y - 4);
        this.ctx.restore();
    }

    drawProjectile(projectile) {
        const size = 12;
        this.createOrUpdateEntity(`projectile-${projectile.x}-${projectile.y}`, 'bi-circle-fill', projectile.x, projectile.y, size, '#ffeb3b');
    }

    render(gameState) {
        // Track which entities get drawn this frame so we can clean up removed ones
        this.entitiesDrawnThisFrame = new Set();
        this.clear();
        
        // Update entity container size if canvas changed
        if (this.entityContainer) {
            this.entityContainer.style.width = this.canvas.width + 'px';
            this.entityContainer.style.height = this.canvas.height + 'px';
        }

        // Draw map first (background)
        this.drawMap(gameState.mapSystem);

        // Draw collectibles (so they appear behind other objects)
        gameState.collectibles.forEach(collectible => {
            this.drawCollectible(collectible);
        });

        // Draw doors
        gameState.doors.forEach(door => {
            this.drawDoor(door);
            
            // Show interaction hint if near locked door
            if (!door.unlocked) {
                const distance = Math.sqrt(
                    Math.pow(gameState.player.x + gameState.player.width/2 - (door.x + door.width/2), 2) +
                    Math.pow(gameState.player.y + gameState.player.height/2 - (door.y + door.height/2), 2)
                );
                if (distance < 60 && !gameState.player.hidden) {
                    this.drawDoorRequirementHint(door, door.x + door.width/2, door.y - 10);
                }
            }
        });

        // Draw interactive objects
        gameState.interactiveObjects.forEach(obj => {
            this.drawInteractiveObject(obj);
            
            // Check if player is near and show interaction hint
            if (obj.active && !(obj.type === "bomb" && obj.solved) && 
                !(obj.type === "loot" && obj.collected)) {
                const distance = Math.sqrt(
                    Math.pow(gameState.player.x + gameState.player.width/2 - (obj.x + obj.width/2), 2) +
                    Math.pow(gameState.player.y + gameState.player.height/2 - (obj.y + obj.height/2), 2)
                );
                if (distance < 50 && !gameState.player.hidden) {
                    this.drawInteractionHint(obj.x + obj.width/2, obj.y);
                    this.drawInteractiveInfo(obj, obj.x + obj.width/2, obj.y - 12);
                }
            }
        });

        // Highlight collectible descriptions when nearby
        gameState.collectibles.forEach(collectible => {
            if (collectible.collected) return;
            const distance = Math.sqrt(
                Math.pow(gameState.player.x + gameState.player.width/2 - (collectible.x + collectible.width/2), 2) +
                Math.pow(gameState.player.y + gameState.player.height/2 - (collectible.y + collectible.height/2), 2)
            );
            if (distance < 50 && !gameState.player.hidden) {
                this.drawCollectibleInfo(collectible, collectible.x + collectible.width/2, collectible.y - 10);
            }
        });

        // Draw enemies
        gameState.enemies.forEach(enemy => {
            this.drawEnemy(enemy);
        });

        // Draw projectiles (player)
        gameState.projectiles.forEach((projectile, index) => {
            this.createOrUpdateEntity(`proj-${index}`, ICON_CONFIG.projectile, projectile.x, projectile.y, 12, '#ffeb3b');
        });

        // Draw enemy projectiles
        gameState.enemyProjectiles.forEach((projectile, index) => {
            this.createOrUpdateEntity(`enemy-proj-${index}`, ICON_CONFIG.projectile, projectile.x, projectile.y, 12, '#ff4444');
        });

        // Draw player
        this.drawPlayer(gameState.player);

        // Draw hide status indicator
        if (gameState.player.hidden) {
            this.ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            const timeLeft = Math.ceil(gameState.player.hideTimeRemaining);
            this.ctx.fillText(`HIDDEN (${timeLeft}s)`, gameState.player.x + gameState.player.width/2, gameState.player.y - 10);
        } else if (gameState.player.hideUsed) {
            // Show that hide has been used
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('HIDE USED', gameState.player.x + gameState.player.width/2, gameState.player.y - 10);
        }

        this.cleanupEntities();
    }

    cleanupEntities() {
        if (!this.entityContainer || !this.entitiesDrawnThisFrame) return;

        // Remove any DOM elements not rendered this frame
        const children = Array.from(this.entityContainer.children);
        children.forEach(child => {
            if (!this.entitiesDrawnThisFrame.has(child.id)) {
                child.remove();
            }
        });
    }

    updateHUD(gameState, missionManager) {
        const healthEl = document.getElementById('health-value');
        const scoreEl = document.getElementById('score-value');
        const missionsEl = document.getElementById('missions-value');
        const levelEl = document.getElementById('level-value');
        const timerEl = document.getElementById('timer-value');

        if (healthEl) {
            healthEl.textContent = Math.max(0, gameState.player.health);
            healthEl.style.color = gameState.player.health < 30 ? '#f44336' : '#4CAF50';
        }
        if (scoreEl) {
            scoreEl.textContent = gameState.score;
        }
        if (missionsEl) {
            missionsEl.textContent = `${missionManager.getCompletedCount()}/${missionManager.getTotalCount()}`;
        }
        if (levelEl) {
            levelEl.textContent = gameState.currentLevel;
        }
        if (timerEl) {
            const remaining = Math.max(0, Math.ceil(gameState.levelTimer));
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            timerEl.style.color = remaining <= 10 ? '#f44336' : '#ffffff';
        }

        // Update inventory
        const keysEl = document.getElementById('keys-count');
        const moneyEl = document.getElementById('money-count');
        const secretsEl = document.getElementById('secrets-count');

        if (keysEl) keysEl.textContent = gameState.inventory.keys;
        if (moneyEl) moneyEl.textContent = gameState.inventory.money;
        if (secretsEl) secretsEl.textContent = gameState.inventory.secrets;
    }

    updateMissionPanel(missionManager) {
        const missionList = document.getElementById('mission-list');
        if (!missionList) return;

        missionList.innerHTML = '';
        missionManager.missions.forEach(mission => {
            const li = document.createElement('li');
            li.textContent = mission.description;
            if (mission.completed) {
                li.classList.add('completed');
            }
            missionList.appendChild(li);
        });
    }
}

export default Renderer;
