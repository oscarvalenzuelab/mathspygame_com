// Main game entry point
import InputManager from './input.js';
import GameState from './gameState.js';
import Renderer from './render.js';
import MathEngine from './mathEngine.js';
import MissionManager from './missions.js';
import LevelManager from './levels.js';
import AudioManager from './audio.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.setupCanvas();
        this.deviceWarning = document.getElementById('device-warning');
        this.validateDeviceSupport();

        this.inputManager = new InputManager(this.canvas);
        this.gameState = new GameState(this.canvas.width, this.canvas.height);
        this.renderer = new Renderer(this.canvas);
        this.mathEngine = new MathEngine();
        this.missionManager = new MissionManager();
        this.levelManager = new LevelManager();
        this.notificationContainer = document.getElementById('notification-container');
        this.audioManager = new AudioManager();
        this.gameState.setChangeListener(() => this.requestSave());
        this.allowPersistence = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
        this.pendingSave = false;
        this.saveAccumulator = 0;
        this.currentMathDifficulty = 1;
        this.agentName = '';
        this.agentNameLabel = document.getElementById('agent-name-label');
        
        // Setup entity container after renderer is created
        this.renderer.setupEntityContainer();
        
        this.lastTime = 0;
        this.isRunning = false;
        
        this.setupUI();
        this.initializeAgentName();
        if (this.allowPersistence) {
            window.addEventListener('beforeunload', () => this.writeSave(true));
            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.writeSave(true);
                }
            });
        }

        const restored = this.restoreProgress();
        if (!restored) {
            this.loadLevel(1);
            this.requestSave();
            this.writeSave(true);
        }
        this.setupMusicAutoStart();
        this.setupAudioHooks();
        window.addEventListener('resize', () => this.validateDeviceSupport());
    }

    validateDeviceSupport() {
        if (!this.deviceWarning) return;
        const minWidth = 900;
        const minHeight = 600;
        const isSupported = window.innerWidth >= minWidth && window.innerHeight >= minHeight;
        this.deviceWarning.classList.toggle('hidden', isSupported);
        this.canvas.parentElement.classList.toggle('blurred', !isSupported);
    }

    loadLevel(levelNumber, options = {}) {
        const levelData = this.levelManager.getLevel(levelNumber);
        this.currentMathDifficulty = levelData.mathDifficulty || 1;
        this.gameState.loadLevel(levelData, options);
        this.gameState.currentLevel = levelNumber;
        this.missionManager.initializeLevel(levelNumber, levelData);
        this.renderer.updateMissionPanel(this.missionManager);
    }

    restoreProgress() {
        if (!this.allowPersistence) {
            return false;
        }

        try {
            const raw = window.localStorage.getItem('af_save');
            if (!raw) return false;
            const data = JSON.parse(raw);
            const totalLevels = this.levelManager.getTotalLevels();
            const targetLevel = Math.max(1, Math.min(totalLevels, data.currentLevel || 1));
            if (Array.isArray(data.gameState?.defeatedEnemyIds)) {
                this.gameState.defeatedEnemies = new Set(data.gameState.defeatedEnemyIds);
            }
            this.loadLevel(targetLevel, { preserveDefeated: true });
            if (data.gameState) {
                this.gameState.applySaveData(data.gameState);
            }
            if (data.missions) {
                this.missionManager.loadFromData(data.missions);
                this.renderer.updateMissionPanel(this.missionManager);
            }
            this.requestSave();
            this.writeSave(true);
            return true;
        } catch (error) {
            console.warn('Failed to restore save data', error);
            return false;
        }
    }

    requestSave() {
        if (!this.allowPersistence) return;
        this.pendingSave = true;
        this.saveAccumulator = 0;
    }

    writeSave(force = false) {
        if (!this.allowPersistence) return;
        if (!force && !this.pendingSave && this.saveAccumulator < 5) {
            return;
        }
        try {
            const payload = {
                version: 1,
                currentLevel: this.gameState.currentLevel,
                gameState: this.gameState.getSaveData(),
                missions: this.missionManager.getSaveData(),
                timestamp: Date.now()
            };
            window.localStorage.setItem('af_save', JSON.stringify(payload));
            this.pendingSave = false;
            this.saveAccumulator = 0;
        } catch (error) {
            console.warn('Failed to persist save data', error);
        }
    }

    clearSave() {
        if (!this.allowPersistence) return;
        try {
            window.localStorage.removeItem('af_save');
        } catch (error) {
            console.warn('Failed to clear save data', error);
        }
    }

    setupCanvas() {
        // Set canvas size - auto-adjust to viewport
        const maxWidth = Math.min(1200, window.innerWidth - 40);
        const maxHeight = Math.min(800, window.innerHeight - 40);
        
        // Maintain aspect ratio
        const aspectRatio = 1200 / 800;
        let canvasWidth = maxWidth;
        let canvasHeight = canvasWidth / aspectRatio;
        
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        }
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const newMaxWidth = Math.min(1200, window.innerWidth - 40);
            const newMaxHeight = Math.min(800, window.innerHeight - 40);
            
            let newCanvasWidth = newMaxWidth;
            let newCanvasHeight = newCanvasWidth / aspectRatio;
            
            if (newCanvasHeight > newMaxHeight) {
                newCanvasHeight = newMaxHeight;
                newCanvasWidth = newCanvasHeight * aspectRatio;
            }
            
            this.canvas.width = newCanvasWidth;
            this.canvas.height = newCanvasHeight;
            this.gameState.canvasWidth = newCanvasWidth;
            this.gameState.canvasHeight = newCanvasHeight;
            this.gameState.mapSystem.canvasWidth = newCanvasWidth;
            this.gameState.mapSystem.canvasHeight = newCanvasHeight;
            // Update renderer entity container
            if (this.renderer.entityContainer) {
                this.renderer.entityContainer.style.width = newCanvasWidth + 'px';
                this.renderer.entityContainer.style.height = newCanvasHeight + 'px';
            }
        });
    }

    setupUI() {
        this.musicToggleBtn = document.getElementById('music-toggle-btn');
        const storedPref = this.allowPersistence ? window.localStorage.getItem('af_music_enabled') : null;
        this.musicEnabled = storedPref === null ? true : storedPref === 'true';
        if (this.musicToggleBtn) {
            this.updateMusicToggleButton();
            this.musicToggleBtn.addEventListener('click', () => this.toggleMusic());
        }

        // Math modal setup
        const mathModal = document.getElementById('math-modal');
        const mathQuestionText = document.getElementById('math-question-text');
        const mathAnswerInput = document.getElementById('math-answer-input');
        const mathSubmitBtn = document.getElementById('math-submit-btn');
        const mathCancelBtn = document.getElementById('math-cancel-btn');
        const mathFeedback = document.getElementById('math-feedback');

        // Store handlers to prevent duplicate listeners
        let currentSubmitHandler = null;
        let currentCancelHandler = null;
        let currentKeypressHandler = null;

        const showMathQuestion = (question, objectId) => {
            // Remove old listeners if they exist
            if (currentSubmitHandler) {
                mathSubmitBtn.removeEventListener('click', currentSubmitHandler);
            }
            if (currentCancelHandler) {
                mathCancelBtn.removeEventListener('click', currentCancelHandler);
            }
            if (currentKeypressHandler) {
                mathAnswerInput.removeEventListener('keypress', currentKeypressHandler);
            }

            mathModal.classList.remove('hidden');
            mathQuestionText.textContent = question.text;
            mathAnswerInput.value = '';
            mathAnswerInput.focus();
            mathFeedback.textContent = '';
            mathFeedback.className = 'feedback';

            const handleSubmit = () => {
                const userAnswer = mathAnswerInput.value;
                const correct = this.mathEngine.checkAnswer(userAnswer, question.correctAnswer);
                
                if (correct) {
                    mathFeedback.textContent = 'Correct!';
                    mathFeedback.className = 'feedback correct';
                    this.gameState.handleMathAnswer(true, objectId);
                    this.audioManager.playSuccessChime();
                    
                    // Check if this completes a mission
                    const obj = this.gameState.interactiveObjects.find(o => o.id === objectId);
                    if (obj) {
                        const missionCompleted = this.missionManager.completeMission(obj.type, objectId);
                        this.renderer.updateMissionPanel(this.missionManager);
                        if (missionCompleted) {
                            this.requestSave();
                        }
                        
                        // Check win condition
                        if (this.missionManager.areAllMissionsComplete()) {
                            // Check if there are more levels
                            if (this.gameState.currentLevel < this.levelManager.getTotalLevels()) {
                                setTimeout(() => {
                                    this.loadLevel(this.gameState.currentLevel + 1);
                                    this.requestSave();
                                }, 1500);
                            } else {
                                setTimeout(() => {
                                    this.showWinScreen();
                                }, 1000);
                            }
                        }
                    }
                    
                    setTimeout(() => {
                        mathModal.classList.add('hidden');
                        this.gameState.isPaused = false;
                        mathSubmitBtn.removeEventListener('click', currentSubmitHandler);
                        mathCancelBtn.removeEventListener('click', currentCancelHandler);
                        mathAnswerInput.removeEventListener('keypress', currentKeypressHandler);
                        currentSubmitHandler = null;
                        currentCancelHandler = null;
                        currentKeypressHandler = null;
                    }, 1000);
                } else {
                    mathFeedback.textContent = 'Wrong! Try again.';
                    mathFeedback.className = 'feedback wrong';
                    this.gameState.handleMathAnswer(false, objectId);
                    this.audioManager.playErrorTone();
                    
                    // Clear input for retry
                    setTimeout(() => {
                        mathAnswerInput.value = '';
                        mathAnswerInput.focus();
                    }, 500);
                }
            };

            const handleCancel = () => {
                mathModal.classList.add('hidden');
                this.gameState.isPaused = false;
                mathSubmitBtn.removeEventListener('click', currentSubmitHandler);
                mathCancelBtn.removeEventListener('click', currentCancelHandler);
                mathAnswerInput.removeEventListener('keypress', currentKeypressHandler);
                currentSubmitHandler = null;
                currentCancelHandler = null;
                currentKeypressHandler = null;
            };

            const handleKeypress = (e) => {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
            };

            // Store handlers
            currentSubmitHandler = handleSubmit;
            currentCancelHandler = handleCancel;
            currentKeypressHandler = handleKeypress;

            mathSubmitBtn.addEventListener('click', currentSubmitHandler);
            mathCancelBtn.addEventListener('click', currentCancelHandler);
            mathAnswerInput.addEventListener('keypress', currentKeypressHandler);
        };

        // Store reference for use in game loop
        this.showMathQuestion = showMathQuestion;

        // Restart buttons
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });

        document.getElementById('restart-win-btn').addEventListener('click', () => {
            this.restart();
        });
    }

    initializeAgentName() {
        this.agentModal = document.getElementById('agent-modal');
        this.agentNameInput = document.getElementById('agent-name-input');
        const saveBtn = document.getElementById('agent-save-btn');
        const changeBtn = document.getElementById('agent-name-change-btn');
        const storedName = this.allowPersistence ? window.localStorage.getItem('af_agent_name') : null;
        this.agentName = storedName || '';
        this.updateAgentNameLabel();

        if (changeBtn) {
            changeBtn.addEventListener('click', () => this.showAgentModal());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAgentName());
        }
        if (this.agentNameInput) {
            this.agentNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveAgentName();
                }
            });
        }

        if (!this.agentName) {
            this.showAgentModal();
        }
    }

    updateAgentNameLabel() {
        if (this.agentNameLabel) {
            const displayName = this.agentName ? `Agent ${this.agentName}` : 'Agent ???';
            this.agentNameLabel.textContent = displayName;
        }
    }

    showAgentModal() {
        if (!this.agentModal) return;
        if (this.agentNameInput) {
            this.agentNameInput.value = this.agentName || '';
            this.agentNameInput.focus();
            this.agentNameInput.select();
        }
        this.agentModal.classList.remove('hidden');
    }

    hideAgentModal() {
        if (!this.agentModal) return;
        this.agentModal.classList.add('hidden');
    }

    saveAgentName() {
        if (!this.agentNameInput) return;
        let value = this.agentNameInput.value.trim();
        if (!value) {
            value = '???';
        }
        this.agentName = value;
        this.updateAgentNameLabel();
        if (this.allowPersistence) {
            window.localStorage.setItem('af_agent_name', value);
        }
        this.hideAgentModal();
    }

    setupAudioHooks() {
        if (!this.inputManager) return;
        this.inputManager.onPlayerShot = () => this.audioManager.playShot();
        this.inputManager.onItemPickup = () => this.audioManager.playItemPickup();
        this.inputManager.onDoorSuccess = () => this.audioManager.playDoorSuccess();
        this.inputManager.onDoorBlocked = () => this.audioManager.playDoorBlocked();
        this.inputManager.onExplosion = () => this.audioManager.playExplosion();
        this.inputManager.onEnemyHit = () => this.audioManager.playEnemyHit();
    }

    handleAutoSave(deltaTime) {
        if (!this.allowPersistence) return;
        this.saveAccumulator += deltaTime;
        if (this.pendingSave || this.saveAccumulator >= 5) {
            this.writeSave();
            this.pendingSave = false;
            this.saveAccumulator = 0;
        }
    }

    updateMusicToggleButton() {
        if (!this.musicToggleBtn) return;
        this.musicToggleBtn.textContent = this.musicEnabled ? 'Music: On' : 'Music: Off';
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.allowPersistence) {
            window.localStorage.setItem('af_music_enabled', this.musicEnabled ? 'true' : 'false');
        }
        this.updateMusicToggleButton();

        if (this.musicEnabled) {
            this.audioManager.startBackgroundMusic();
            this.showNotification('Music ON', 'info');
        } else {
            this.audioManager.stopBackgroundMusic();
            this.showNotification('Music muted', 'warning');
        }
    }

    setupMusicAutoStart() {
        if (!this.musicEnabled) {
            this.updateMusicToggleButton();
            return;
        }

        const startMusic = () => {
            this.audioManager.startBackgroundMusic();
            window.removeEventListener('pointerdown', startMusic);
            window.removeEventListener('keydown', startMusic);
        };

        window.addEventListener('pointerdown', startMusic);
        window.addEventListener('keydown', startMusic);
    }

    showNotification(message, type = 'info', duration = 3000) {
        if (!this.notificationContainer) return;
        const note = document.createElement('div');
        note.className = `notification ${type}`;
        note.textContent = message;
        this.notificationContainer.appendChild(note);

        requestAnimationFrame(() => {
            note.classList.add('show');
        });

        setTimeout(() => {
            note.classList.add('fade-out');
        }, Math.max(0, duration - 400));

        setTimeout(() => {
            note.remove();
        }, duration);
    }

    showWinScreen() {
        const winModal = document.getElementById('win-modal');
        const finalScore = document.getElementById('final-score');
        finalScore.textContent = this.gameState.score;
        winModal.classList.remove('hidden');
        this.gameState.won = true;
        this.clearSave();
    }

    showGameOverScreen() {
        const gameOverModal = document.getElementById('game-over-modal');
        const gameOverTitle = document.getElementById('game-over-title');
        const gameOverMessage = document.getElementById('game-over-message');
        
        gameOverTitle.textContent = 'Mission Failed';
        if (this.gameState.gameOverReason === 'timer') {
            gameOverMessage.textContent = `The main bomb detonated after 2 minutes. Final Score: ${this.gameState.score}`;
        } else if (this.gameState.gameOverReason === 'trap_bomb') {
            gameOverMessage.textContent = `The trapped briefcase exploded before you could recover the password. Final Score: ${this.gameState.score}`;
        } else {
            gameOverMessage.textContent = `Your health reached zero. Final Score: ${this.gameState.score}`;
        }
        gameOverModal.classList.remove('hidden');
    }

    restart() {
        // Hide all modals
        document.getElementById('math-modal').classList.add('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('win-modal').classList.add('hidden');
        
        // Reset game state
        this.clearSave();
        this.gameState.reset();
        this.loadLevel(1);
        this.requestSave();
        
        // Restart game loop
        this.start();
    }

    update(deltaTime) {
        if (this.gameState.gameOver && !this.gameState.won) {
            if (!document.getElementById('game-over-modal').classList.contains('hidden')) {
                return; // Already showing game over screen
            }
            this.showGameOverScreen();
            return;
        }

        if (this.gameState.won) {
            return; // Game won, waiting for restart
        }

        // Check for interactions (must be before clearing pressed keys)
        if (!this.gameState.isPaused) {
            const interactionObj = this.gameState.checkInteractions(this.inputManager);
            if (interactionObj) {
                // Handle door interactions
                if (interactionObj.type === "door_unlocked") {
                    // Door unlocked successfully - show brief message
                    this.showNotification('Door unlocked. Stay sharp!', 'info');
                } else if (interactionObj.type === "door_locked") {
                    // Door is locked and player doesn't have key
                    this.showNotification(interactionObj.message, 'warning');
                } else if (interactionObj.type === 'requires_intel') {
                    this.showNotification(interactionObj.message, 'warning');
                } else if (interactionObj.id) {
                    // Regular interactive object (bomb, intel) - show math question
                    this.gameState.isPaused = true;
                    const question = this.mathEngine.generateQuestion(this.currentMathDifficulty || 1);
                    this.gameState.currentMathQuestion = question;
                    this.showMathQuestion(question, interactionObj.id);
                }
            }
        }

        // Update game state
        const movementVector = this.inputManager.getMovementVector();
        this.gameState.updatePlayer(deltaTime, movementVector, this.inputManager);
        this.gameState.updateSpawnGrace(deltaTime);
        this.gameState.updateEnemies(deltaTime);
        this.gameState.updateEnemyProjectiles(deltaTime);
        this.gameState.updateProjectiles(deltaTime);
        this.gameState.updateTrapBombs(deltaTime, this.inputManager);
        this.gameState.updateMissionTimer(deltaTime);
        this.gameState.checkCollisions();
        this.gameState.checkCollectibles(this.inputManager);

        // Clear pressed keys at end of frame
        this.inputManager.clearPressedKeys();
        this.handleAutoSave(deltaTime);
    }

    render() {
        this.renderer.render(this.gameState);
        this.renderer.updateHUD(this.gameState, this.missionManager);
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Cap deltaTime to prevent large jumps
        const clampedDelta = Math.min(deltaTime, 0.1);

        this.update(clampedDelta);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(performance.now());
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new Game();
        game.start();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error loading game. Please check the browser console for details.\n\nMake sure you are running the game through a local web server (not file://).\n\nYou can use: python3 -m http.server 8000');
    }
});
