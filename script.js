// Game config 
const GAME_CONFIG = {
    LEVELS: [
        { level: 1, gridSize: [2, 2], title: "Training Grid", description: "Match all pairs to advance", timeLimit: 30 },
        { level: 2, gridSize: [2, 3], title: "Basic Protocol", description: "Complexity increasing...", timeLimit: 45 },
        { level: 3, gridSize: [3, 4], title: "Standard Matrix", description: "Neural patterns detected", timeLimit: 60 },
        { level: 4, gridSize: [4, 5], title: "Advanced Network", description: "High-level encryption active", timeLimit: 75 },
        { level: 5, gridSize: [5, 6], title: "Master Protocol", description: "Maximum security challenge", timeLimit: 90 },
        { level: 6, gridSize: [6, 6], title: "Automonous Agent", description: "Ultimate challenge", timeLimit: 120 }
    ],
    BASE_POINTS: 10, // Base points for level 1
    getPointsForLevel: (level) => GAME_CONFIG.BASE_POINTS * Math.pow(2, level - 1)
};

// Card symbols
const CARD_SYMBOLS = [
    '🔷', '🔶', '🌟', '💎', '🎯',
    '🚀', '⭐', '💫', '🔥', '⚙️',
    '🧊', '🔗',  '⚛️', '🛰️', '💾'
];

// Special logo symbol  
const LOGO_SYMBOL = 'assets/nexus.png';

// Game state 
class GameState {
    constructor() {
        this.currentLevel = 1;
        this.totalNexPoints = 0;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.timeLeft = 0;
        this.gameTimer = null;
        this.isGameActive = false;
        this.canFlip = true;
        this.gameScreen = 'welcome'; 
        this.hintsRemaining = 3; 
        this.hasLogoCard = false; 
        this.livesRemaining = 3; 
    }

    reset() {
        this.currentLevel = 1;
        this.totalNexPoints = 0;
        this.hintsRemaining = 3; 
        this.livesRemaining = 3; 
        this.resetLevel();
    }

    resetLevel() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.timeLeft = this.getCurrentLevelConfig().timeLimit;
        this.isGameActive = false;
        this.canFlip = true;
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    getCurrentLevelConfig() {
        return GAME_CONFIG.LEVELS[this.currentLevel - 1];
    }

    getLevelPoints() {
        return GAME_CONFIG.getPointsForLevel(this.currentLevel);
    }

    isLastLevel() {
        return this.currentLevel >= GAME_CONFIG.LEVELS.length;
    }

    nextLevel() {
        if (!this.isLastLevel()) {
            this.currentLevel++;
            this.resetLevel();
            return true;
        }
        return false;
    }
}

// Game class
class ChainMatchGame {
    constructor() {
        this.state = new GameState();
        this.elements = {
            // Screens
            welcomeScreen: document.getElementById('welcomeScreen'),
            gameScreen: document.getElementById('gameScreen'),
            
            // Welcome screen elements
            startGameBtn: document.getElementById('startGameBtn'),
            
            // Game screen elements
            cardGrid: document.getElementById('cardGrid'),
            nexPointsDisplay: document.getElementById('nexPoints'),
            timerDisplay: document.getElementById('timer'),
            currentLevelDisplay: document.getElementById('currentLevel'),
            levelTitle: document.getElementById('levelTitle'),
            levelDescription: document.getElementById('levelDescription'),
            restartBtn: document.getElementById('restartBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            
            // Modals
            levelCompleteModal: document.getElementById('levelCompleteModal'),
            levelCompleteTitle: document.getElementById('levelCompleteTitle'),
            levelCompleteMessage: document.getElementById('levelCompleteMessage'),
            levelBonus: document.getElementById('levelBonus'),
            totalNexPoints: document.getElementById('totalNexPoints'),
            nextLevelBtn: document.getElementById('nextLevelBtn'),
            
            gameCompleteModal: document.getElementById('gameCompleteModal'),
            gameCompleteTitle: document.getElementById('gameCompleteTitle'),
            gameCompleteMessage: document.getElementById('gameCompleteMessage'),
            finalNexPoints: document.getElementById('finalNexPoints'),
            achievementText: document.getElementById('achievementText'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            
            gameOverModal: document.getElementById('gameOverModal'),
            gameOverTitle: document.getElementById('gameOverTitle'),
            gameOverMessage: document.getElementById('gameOverMessage'),
            gameOverNexPoints: document.getElementById('gameOverNexPoints'),
            retryLevelBtn: document.getElementById('retryLevelBtn'),
            backToMenuBtn: document.getElementById('backToMenuBtn'),

            // Pause menu elements
            pauseMenuModal: document.getElementById('pauseMenuModal'),
            soundToggleBtn: document.getElementById('soundToggleBtn'),
            resumeGameBtn: document.getElementById('resumeGameBtn'),
            quitToMenuBtn: document.getElementById('quitToMenuBtn')
        };
        
        // Initialize audio elements
        this.sounds = {
            flip: new Audio('assets/flip.mp3'),
            match: new Audio('assets/match.mp3'),
            win: new Audio('assets/win.mp3')
        };
        
        // Set audio properties
        Object.values(this.sounds).forEach(audio => {
            audio.preload = 'auto';
            audio.volume = 0.5;
        });
        
        this.soundEnabled = true;
        this.isPaused = false;
        this.init();
        this.setupHints();
    }

    init() {
        this.setupEventListeners();
        this.preloadAssets();
        this.showWelcomeScreen();
        this.loadSoundPreference();
    }

    preloadAssets() {
        // Preload the logo image
        const logoImg = new Image();
        logoImg.src = LOGO_SYMBOL;
        
        // Preload sounds
        Object.values(this.sounds).forEach(audio => {
            audio.load();
        });
    }

    loadSoundPreference() {
        const savedSoundState = localStorage.getItem('soundEnabled');
        if (savedSoundState !== null) {
            this.soundEnabled = savedSoundState === 'true';
            this.updateSoundButton();
        }
    }

    saveSoundPreference() {
        localStorage.setItem('soundEnabled', this.soundEnabled);
    }

    updateSoundButton() {
        const btn = this.elements.soundToggleBtn;
        const icon = btn.querySelector('.btn-icon');
        const text = btn.querySelector('.sound-text');
        
        if (this.soundEnabled) {
            icon.textContent = '🔊';
            text.textContent = 'Sound On';
            btn.classList.remove('sound-off');
        } else {
            icon.textContent = '🔇';
            text.textContent = 'Sound Off';
            btn.classList.add('sound-off');
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateSoundButton();
        this.saveSoundPreference();
        
        // Play a test sound if turning on
        if (this.soundEnabled) {
            this.playSound('flip');
        }
    }

    async playSound(sound) {
        if (!this.soundEnabled || !this.sounds[sound] || this.isPaused) return;
        
        try {
            const audio = this.sounds[sound];
            audio.currentTime = 0;
            await audio.play();
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }

    setupEventListeners() {
        // Welcome screen
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        
        // Pause menu
        this.elements.soundToggleBtn.addEventListener('click', () => this.toggleSound());
        this.elements.resumeGameBtn.addEventListener('click', () => this.resumeGame());
        this.elements.quitToMenuBtn.addEventListener('click', () => this.quitToMenu());
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        
        this.elements.restartBtn.addEventListener('click', () => {
            if (this.state.livesRemaining > 0) {
                this.state.livesRemaining--;
                this.updateLivesDisplay();
                
                if (this.state.livesRemaining <= 0) {
                    this.endGame(false);
                } else {
                    this.restartLevel();
                }
            }
        });
        
        // Level complete modal
        this.elements.nextLevelBtn.addEventListener('click', () => this.proceedToNextLevel());
        
        // Game complete modal
        this.elements.playAgainBtn.addEventListener('click', () => this.restartGame());
        
        // Game over modal
        this.elements.retryLevelBtn.addEventListener('click', () => {
            this.hideModal();
            this.restartLevel();
        });
        this.elements.backToMenuBtn.addEventListener('click', () => {
            this.hideModal();
            this.showWelcomeScreen();
        });

        
        this.elements.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.elements.gameOverModal) {
                this.hideModal();
                this.showWelcomeScreen();
            }
        });

        // Add pause menu keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state.gameScreen === 'playing') {
                    this.togglePause();
                }
            }
        });
    }

    showWelcomeScreen() {
        this.state.gameScreen = 'welcome';
        this.state.reset();
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.gameScreen.style.display = 'none';
        this.hideModal();
    }

    startGame() {
        this.state.gameScreen = 'playing';
        this.state.reset();
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.gameScreen.style.display = 'flex';
        this.updateLivesDisplay();
        this.startLevel();
    }

    startLevel() {
        this.state.resetLevel();
        this.generateCards();
        this.renderCards();
        this.updateUI();
        this.startTimer();
        this.state.isGameActive = true;
        this.isPaused = false;
        this.elements.pauseBtn.querySelector('.pause-icon').textContent = '⏸';
        
        // Add resize listener to adjust card size when window changes
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    restartLevel() {
        // Store the current level
        const currentLevel = this.state.currentLevel;
        
        // Calculate points earned in previous levels
        let previousLevelPoints = 0;
        for (let i = 1; i < currentLevel; i++) {
            previousLevelPoints += GAME_CONFIG.getPointsForLevel(i);
            const levelConfig = GAME_CONFIG.LEVELS[i - 1];
            const [rows, cols] = levelConfig.gridSize;
            const pairsCount = (rows * cols) / 2;
            previousLevelPoints += pairsCount * 10;
        }
        
        // Reset the level
        this.state.resetLevel();
        
        // Reset points to only include previous levels
        this.state.totalNexPoints = previousLevelPoints;
        
        // Start the level again
        this.startLevel();
    }

    restartGame() {
        this.state.reset();
        this.updateLivesDisplay();
        this.startGame();
    }

    generateCards() {
        const levelConfig = this.state.getCurrentLevelConfig();
        const [rows, cols] = levelConfig.gridSize;
        const totalCards = rows * cols;
        const pairsCount = totalCards / 2;
        
        // Ensure we have an even number of cards
        if (totalCards % 2 !== 0) {
            throw new Error(`Invalid grid size: ${rows}x${cols} results in odd number of cards`);
        }
        
        // Randomly decide if this level will have a logo card (20% chance)
        this.state.hasLogoCard = Math.random() < 0.2;
        
        // Create pairs of symbols
        let symbols = CARD_SYMBOLS.slice(0, pairsCount);
        
        // If we're including the logo, replace one random symbol with it
        if (this.state.hasLogoCard && pairsCount > 1) {
            const randomIndex = Math.floor(Math.random() * (pairsCount - 1)) + 1;
            symbols[randomIndex] = LOGO_SYMBOL;
        }
        
        const cardPairs = [...symbols, ...symbols];
        
        // Shuffle the cards
        this.state.cards = this.shuffleArray(cardPairs).map((symbol, index) => ({
            id: index,
            symbol: symbol,
            isFlipped: false,
            isMatched: false,
            isLogo: symbol === LOGO_SYMBOL
        }));
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    renderCards() {
        const levelConfig = this.state.getCurrentLevelConfig();
        const [rows, cols] = levelConfig.gridSize;
        
        this.elements.cardGrid.innerHTML = '';
        
        // Add level-specific class to game board for responsive sizing
        document.querySelector('.game-board').className = 
            `game-board level-${this.state.currentLevel}`;
        
        this.state.cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.elements.cardGrid.appendChild(cardElement);
        });
        
        // Adjust card size based on grid dimensions
        this.adjustCardSize(rows, cols);
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'game-card';
        cardDiv.dataset.cardId = card.id;
        cardDiv.tabIndex = 0; // Make focusable for accessibility
        
        const cardContent = document.createElement('div');
        cardContent.className = card.isFlipped || card.isMatched ? 'card-front' : 'card-back';
        
        // If it's the logo card, use an image instead of text
        if (card.symbol === LOGO_SYMBOL) {
            if (card.isFlipped || card.isMatched) {
                // Clear any text content first
                cardContent.innerHTML = '';
                
                // Create and append the image
                const logoImg = document.createElement('img');
                logoImg.src = LOGO_SYMBOL;
                logoImg.alt = 'Nexus Logo';
                logoImg.className = 'card-logo';
                cardContent.appendChild(logoImg);
            } else {
                cardContent.textContent = '?';
            }
        } else {
            cardContent.textContent = card.isFlipped || card.isMatched ? card.symbol : '?';
        }
        
        cardDiv.appendChild(cardContent);
        
        // Add event listeners
        cardDiv.addEventListener('click', () => this.handleCardClick(card.id));
        cardDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleCardClick(card.id);
            }
        });
        
        return cardDiv;
    }

    handleCardClick(cardId) {
        if (!this.state.isGameActive || !this.state.canFlip) return;
        
        const card = this.state.cards[cardId];
        
        // If card is already matched, do nothing
        if (card.isMatched) return;
        
        // If card is already flipped, unflip it (only if it's the only flipped card)
        if (card.isFlipped) {
            if (this.state.flippedCards.length === 1) {
                this.unflipCard(cardId);
                this.state.flippedCards = [];
            }
            return;
        }
        
        // Flip the card
        this.flipCard(cardId);
        
        // Check if we have two flipped cards
        if (this.state.flippedCards.length === 2) {
            this.state.canFlip = false;
            setTimeout(() => this.checkForMatch(), 600);
        }
    }

    flipCard(cardId) {
        const card = this.state.cards[cardId];
        if (!card || card.isFlipped || card.isMatched || !this.state.canFlip) return;

        card.isFlipped = true;
        this.state.flippedCards.push(cardId);
        this.playSound('flip');
        
        // Update the card visual
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        const cardContent = cardElement.querySelector('div');
        
        cardElement.classList.add('flipped');
        cardContent.className = 'card-front';
        
        // If it's a logo card, create and append the image
        if (card.symbol === LOGO_SYMBOL) {
            cardContent.innerHTML = '';
            const logoImg = document.createElement('img');
            logoImg.src = LOGO_SYMBOL;
            logoImg.alt = 'Nexus Logo';
            logoImg.className = 'card-logo';
            cardContent.appendChild(logoImg);
        } else {
            cardContent.textContent = card.symbol;
        }
    }

    checkForMatch() {
        const [firstCardId, secondCardId] = this.state.flippedCards;
        const firstCard = this.state.cards[firstCardId];
        const secondCard = this.state.cards[secondCardId];
        
        if (firstCard.symbol === secondCard.symbol) {
            // Match found!
            this.handleMatch(firstCardId, secondCardId);
        } else {
            // No match
            this.handleMismatch(firstCardId, secondCardId);
        }
        
        this.state.flippedCards = [];
        this.state.canFlip = true;
    }

    handleMatch(firstCardId, secondCardId) {
        const firstCard = this.state.cards[firstCardId];
        const secondCard = this.state.cards[secondCardId];
        
        if (firstCard && secondCard) {
            firstCard.isMatched = true;
            secondCard.isMatched = true;
            this.state.matchedPairs++;
            
            this.playSound('match');
            
            // Mark cards as matched
            const firstCardElement = document.querySelector(`[data-card-id="${firstCardId}"]`);
            const secondCardElement = document.querySelector(`[data-card-id="${secondCardId}"]`);
            
            firstCardElement.classList.add('matched');
            secondCardElement.classList.add('matched');
            
            // Calculate position for the points indicator 
            const firstRect = firstCardElement.getBoundingClientRect();
            const secondRect = secondCardElement.getBoundingClientRect();
            const centerX = (firstRect.left + secondRect.left + firstRect.width + secondRect.width) / 4;
            const centerY = (firstRect.top + secondRect.top + firstRect.height + secondRect.height) / 4;
            
            // Check if this is a logo match
            if (firstCard.symbol === LOGO_SYMBOL) {
                // For logo match, only award the logo bonus (100 points)
                const logoBonus = 100;
                this.state.totalNexPoints += logoBonus;
                
                // Show special animation for logo match
                firstCardElement.classList.add('logo-match');
                secondCardElement.classList.add('logo-match');
                
                // Create and show bonus points indicator for logo match
                const bonusPoints = document.createElement('div');
                bonusPoints.className = 'bonus-points logo-bonus';
                bonusPoints.textContent = `+${logoBonus}`;
                bonusPoints.style.position = 'fixed';
                bonusPoints.style.left = `${centerX}px`;
                bonusPoints.style.top = `${centerY}px`;
                bonusPoints.style.transform = 'translate(-50%, -50%)';
                document.body.appendChild(bonusPoints);
                
                // Remove the bonus points indicator after animation completes
                setTimeout(() => {
                    if (bonusPoints.parentNode) {
                        bonusPoints.parentNode.removeChild(bonusPoints);
                    }
                }, 2000);
                
                // Add 2 hints when logo is matched
                this.state.hintsRemaining += 2;
                
                // Show hint bonus animation
                const hintBonus = document.createElement('div');
                hintBonus.className = 'hint-bonus';
                hintBonus.textContent = '+2 HINTS';
                document.body.appendChild(hintBonus);
                
                // Remove the hint bonus indicator after animation completes
                setTimeout(() => {
                    if (hintBonus.parentNode) {
                        hintBonus.parentNode.removeChild(hintBonus);
                    }
                }, 2000);
                
                // Animate the hint count
                if (this.elements.hintCount) {
                    this.elements.hintCount.classList.add('hint-added');
                    setTimeout(() => {
                        this.elements.hintCount.classList.remove('hint-added');
                    }, 1500);
                }
                
                // Announce the bonus
                announceToScreen('LOGO MATCH! +100 BONUS POINTS AND +2 HINTS!');
            } else {
                // For regular match, award standard points (10)
                const matchPoints = 10;
                this.state.totalNexPoints += matchPoints;
                
                // Create and show points indicator for regular match
                const pointsIndicator = document.createElement('div');
                pointsIndicator.className = 'bonus-points';
                pointsIndicator.textContent = `+${matchPoints}`;
                pointsIndicator.style.position = 'fixed';
                pointsIndicator.style.left = `${centerX}px`;
                pointsIndicator.style.top = `${centerY}px`;
                pointsIndicator.style.transform = 'translate(-50%, -50%)';
                document.body.appendChild(pointsIndicator);
                
                // Remove the points indicator after animation completes
                setTimeout(() => {
                    if (pointsIndicator.parentNode) {
                        pointsIndicator.parentNode.removeChild(pointsIndicator);
                    }
                }, 2000);
            }
            
            // Update UI to show new points and hint count
            this.updateUI();
            
            // Check if level is complete
            if (this.state.matchedPairs === this.state.cards.length / 2) {
                this.completeLevel();
            }
        }
    }

    handleMismatch(firstCardId, secondCardId) {
        const firstCardElement = document.querySelector(`[data-card-id="${firstCardId}"]`);
        const secondCardElement = document.querySelector(`[data-card-id="${secondCardId}"]`);
        
        // Add shake animation
        firstCardElement.classList.add('mismatch');
        secondCardElement.classList.add('mismatch');
        
        setTimeout(() => {
            // Flip cards back
            this.unflipCard(firstCardId);
            this.unflipCard(secondCardId);
        
            // Remove animation classes
            firstCardElement.classList.remove('mismatch');
            secondCardElement.classList.remove('mismatch');
        }, 500);
    }

    unflipCard(cardId) {
        const card = this.state.cards[cardId];
        card.isFlipped = false;
        
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        const cardContent = cardElement.querySelector('div');
        
        // Add unflipping animation class with rotation
        cardElement.classList.add('unflipping');
        cardElement.classList.remove('flipped');
        
        // Change content at the midpoint of the animation
        setTimeout(() => {
            cardContent.className = 'card-back';
            cardContent.textContent = '?';
        }, 150); // Half of the animation duration
        
        // Remove the animation class when done
        setTimeout(() => {
            cardElement.classList.remove('unflipping');
        }, 300);
    }

    startTimer() {
        this.state.gameTimer = setInterval(() => {
            this.state.timeLeft--;
            this.updateUI();
            
            if (this.state.timeLeft <= 0) {
                this.endGame(false);
            }
        }, 1000);
    }

    completeLevel() {
        this.state.isGameActive = false;
        clearInterval(this.state.gameTimer);
        this.state.gameTimer = null;
        
        this.playSound('win');
        
        // Remove resize listener when level completes
        window.removeEventListener('resize', this.handleResize.bind(this));
        
        const levelBonus = this.state.getLevelPoints();
        this.state.totalNexPoints += levelBonus;
        
        document.querySelectorAll('.game-card').forEach(card => {
            card.classList.add('disabled');
        });
        
        setTimeout(() => this.showLevelCompleteModal(levelBonus), 500);
    }

    showLevelCompleteModal(levelBonus) {
        this.state.gameScreen = 'levelComplete';
        
        this.elements.levelCompleteTitle.textContent = `Level ${this.state.currentLevel} Complete!`;
        this.elements.levelBonus.textContent = levelBonus;
        this.elements.totalNexPoints.textContent = this.state.totalNexPoints;
        
        const levelConfig = this.state.getCurrentLevelConfig();
        this.elements.levelCompleteMessage.textContent = 
            `Excellent work, Guardian! ${levelConfig.title} successfully decoded. Neural patterns analyzed and stored.`;
        
        if (this.state.isLastLevel()) {
            this.elements.nextLevelBtn.textContent = 'Complete Mission';
            this.elements.nextLevelBtn.innerHTML = '<span class="btn-icon">✓</span>Complete Mission';
        } else {
            this.elements.nextLevelBtn.innerHTML = '<span class="btn-icon">→</span>Next Level';
        }
        
        this.elements.levelCompleteModal.classList.add('show');
    }

    proceedToNextLevel() {
        this.hideModal();
        
        if (this.state.isLastLevel()) {
            this.showGameCompleteModal();
        } else {
            this.state.nextLevel();
            this.startLevel();
        }
    }

    showGameCompleteModal() {
        this.state.gameScreen = 'gameComplete';
        
        this.elements.finalNexPoints.textContent = this.state.totalNexPoints;
        
        // Determine achievement based on score
        let achievement = "Chain Guardian";
        if (this.state.totalNexPoints >= 300) {
            achievement = "Nexus Master";
        } else if (this.state.totalNexPoints >= 200) {
            achievement = "Protocol Expert";
        } else if (this.state.totalNexPoints >= 100) {
            achievement = "Network Specialist";
        }
        
        this.elements.achievementText.textContent = achievement;
        this.elements.gameCompleteModal.classList.add('show');
    }

    endGame(isWin) {
        this.state.isGameActive = false;
        clearInterval(this.state.gameTimer);
        
        if (!isWin) {
            this.state.livesRemaining--;
            this.updateLivesDisplay();
            
            if (this.state.livesRemaining <= 0) {
                this.showGameOverModal();
            } else {
                this.restartLevel();
            }
        } else {
            this.showLevelCompleteModal(this.state.getLevelPoints());
        }
    }

    updateLivesDisplay() {
        const livesDisplay = document.getElementById('livesDisplay');
        const lifeIcons = livesDisplay.querySelectorAll('.life-icon');
        
        lifeIcons.forEach((icon, index) => {
            if (index < this.state.livesRemaining) {
                icon.classList.remove('lost');
            } else {
                icon.classList.add('lost');
            }
        });
    }

    showGameOverModal() {
        this.state.gameScreen = 'gameOver';
        this.state.isGameActive = false;
        this.elements.gameOverTitle.textContent = 'Mission Failed!';
        this.elements.gameOverMessage.textContent = 'You\'ve used all your lives. The Nexus network needs your help - try again!';
        this.elements.gameOverNexPoints.textContent = this.state.totalNexPoints;
        this.elements.gameOverModal.classList.add('show');
        
        // Disable all cards
        document.querySelectorAll('.game-card').forEach(card => {
            card.classList.add('disabled');
        });

        // Hide retry button if no lives remaining
        if (this.state.livesRemaining <= 0) {
            this.elements.retryLevelBtn.style.display = 'none';
        } else {
            this.elements.retryLevelBtn.style.display = 'inline-flex';
        }
    }

    hideModal() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    updateUI() {
        const levelConfig = this.state.getCurrentLevelConfig();
        
        this.elements.nexPointsDisplay.textContent = this.state.totalNexPoints;
        this.elements.timerDisplay.textContent = this.state.timeLeft;
        this.elements.currentLevelDisplay.textContent = this.state.currentLevel;
        this.elements.levelTitle.textContent = `Level ${this.state.currentLevel} - ${levelConfig.title}`;
        this.elements.levelDescription.textContent = levelConfig.description;
        
        // Update hint count
        if (this.elements.hintCount) {
            this.elements.hintCount.textContent = this.state.hintsRemaining;
        }
        
        // Add urgency effect when time is low
        if (this.state.timeLeft <= 10 && this.state.isGameActive) {
            this.elements.timerDisplay.style.color = '#ff4444';
            this.elements.timerDisplay.style.animation = 'pulse 1s ease-in-out infinite';
        } else {
            this.elements.timerDisplay.style.color = '#00a2ff';
            this.elements.timerDisplay.style.animation = '';
        }
    }

    setupHints() {
        // Create hint button
        const hintButton = document.createElement('button');
        hintButton.className = 'game-btn';
        hintButton.innerHTML = `<span class="btn-icon">💡</span>Hint (<span class="hint-count">${this.state.hintsRemaining}</span>)`;
        hintButton.addEventListener('click', () => this.useHint());
        
        const gameControls = document.querySelector('.game-controls');
        gameControls.insertBefore(hintButton, this.elements.restartBtn);
        
        this.elements.hintButton = hintButton;
        this.elements.hintCount = hintButton.querySelector('.hint-count');
    }

    useHint() {
        if (!this.state.isGameActive || this.state.hintsRemaining <= 0) return;
        
        // Decrease hint count
        this.state.hintsRemaining--;
        this.elements.hintCount.textContent = this.state.hintsRemaining;
        
        // Find a pair that hasn't been matched yet
        const unmatched = this.state.cards.filter(card => !card.isMatched);
        if (unmatched.length <= 0) return;
        
        // Find a matching pair
        const symbols = {};
        unmatched.forEach(card => {
            if (!symbols[card.symbol]) {
                symbols[card.symbol] = [card.id];
            } else {
                symbols[card.symbol].push(card.id);
            }
        });
        
        // Get a random pair
        const availablePairs = Object.values(symbols).filter(pair => pair.length === 2);
        if (availablePairs.length === 0) return;
        
        const randomPair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
        
        // Highlight the pair briefly
        randomPair.forEach(cardId => {
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            cardElement.classList.add('hint-highlight');
            
            // Remove highlight after animation
            setTimeout(() => {
                cardElement.classList.remove('hint-highlight');
            }, 3000);
        });
    }

    adjustCardSize(rows, cols) {
        const gameBoard = document.querySelector('.game-board');
        const boardHeight = gameBoard.clientHeight - 60; // Account for level header
        const boardWidth = gameBoard.clientWidth;
        
        const cardHeight = Math.floor(boardHeight / rows) - 10;
        const cardWidth = Math.floor(boardWidth / cols) - 10;
        
        const cardSize = Math.min(cardHeight, cardWidth);
        
        document.querySelectorAll('.game-card').forEach(card => {
            card.style.width = `${cardSize}px`;
            card.style.height = `${cardSize}px`;
            card.style.fontSize = `${cardSize * 0.4}px`;
        });
    }

    handleResize() {
        if (this.state.isGameActive) {
            const levelConfig = this.state.getCurrentLevelConfig();
            const [rows, cols] = levelConfig.gridSize;
            this.adjustCardSize(rows, cols);
        }
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    pauseGame() {
        if (!this.state.isGameActive || this.isPaused) return;
        
        this.isPaused = true;
        this.state.canFlip = false;
        clearInterval(this.state.gameTimer);
        this.elements.pauseMenuModal.classList.add('show');
        this.elements.pauseBtn.querySelector('.pause-icon').textContent = '▶';
    }

    resumeGame() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.state.canFlip = true;
        this.startTimer();
        this.elements.pauseMenuModal.classList.remove('show');
        this.elements.pauseBtn.querySelector('.pause-icon').textContent = '⏸';
    }

    quitToMenu() {
        this.isPaused = false;
        this.elements.pauseMenuModal.classList.remove('show');
        this.elements.pauseBtn.querySelector('.pause-icon').textContent = '⏸';
        this.showWelcomeScreen();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    game = new ChainMatchGame();
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Preload animations and effects
document.addEventListener('DOMContentLoaded', () => {
    // Create a temporary element to trigger CSS loading
    const tempDiv = document.createElement('div');
    tempDiv.className = 'game-card flipped matched mismatch';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    document.body.appendChild(tempDiv);
    
    // Remove it after a brief moment
    setTimeout(() => {
        document.body.removeChild(tempDiv);
    }, 100);
});


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// add window resize handler for responsive adjustments
window.addEventListener('resize', debounce(() => {
    
}, 250));


// screen reader announcements
function announceToScreen(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}


