// Sound System
let isSoundMuted = false;
let audioContext = null;

// Initialize audio
function initAudio() {
    console.log('Initializing audio system...');
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.error('Web Audio API not supported:', error);
    }
}

// Function to create a bubble pop sound
function createBubbleSound() {
    if (!audioContext || isSoundMuted) return;

    try {
        // Create oscillator and gain nodes
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();

        // Connect the nodes
        osc.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set up the oscillator
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);

        // Set up the filter
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(1500, audioContext.currentTime);
        filterNode.Q.setValueAtTime(10, audioContext.currentTime);

        // Set up the gain envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);

        // Start and stop
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);

    } catch (error) {
        console.error('Error creating bubble sound:', error);
    }
}

// Function to play sound
function playSound(soundName) {
    if (isSoundMuted) return;
    
    switch(soundName) {
        case 'click':
            createBubbleSound();
            break;
        case 'purchase':
            // Play two bubble sounds in quick succession
            createBubbleSound();
            setTimeout(() => createBubbleSound(), 50);
            break;
        case 'achievement':
            // Play three bubble sounds
            for (let i = 0; i < 3; i++) {
                setTimeout(() => createBubbleSound(), i * 100);
            }
            break;
        case 'prestige':
            // Play five bubble sounds
            for (let i = 0; i < 5; i++) {
                setTimeout(() => createBubbleSound(), i * 150);
            }
            break;
    }
}

// Game state
let gameState = {
    bubbles: 0,
    pearls: 0,
    clickValue: 1,
    prestigeLevel: 0,
    prestigeMultiplier: 1,
    lastSave: Date.now(),
    upgrades: [],
    achievements: [],
    clickCount: 0
};

// Upgrade types
const UPGRADE_TYPES = {
    GOLDEN_HOOK: {
        id: 'golden_hook',
        name: 'Golden Hook',
        basePrice: 250,
        effect: () => { 
            gameState.clickValue *= 1.5;
            updateDisplay();
        },
        description: 'Increases your click value by 50%'
    },
    AUTO_CLICKER: {
        id: 'auto_clicker',
        name: 'Auto-Clicker Crab',
        basePrice: 2000,
        effect: () => { 
            startAutoClicker();
            updateDisplay();
        },
        description: 'Automatically clicks every 10 seconds'
    },
    BUBBLE_MULTIPLIER: {
        id: 'bubble_multiplier',
        name: 'Bubble Multiplier',
        basePrice: 5000,
        effect: () => {
            gameState.clickValue *= 2;
            updateDisplay();
        },
        description: 'Doubles your click value'
    }
};

// Achievement types
const ACHIEVEMENTS = {
    BUBBLE_MASTER: {
        id: 'bubble_master',
        name: 'Bubble Master',
        description: 'Earn 2,500 bubbles in total',
        check: () => gameState.bubbles >= 2500
    },
    SKIN_COLLECTOR: {
        id: 'skin_collector',
        name: 'Skin Collector',
        description: 'Own 3 different fish skins',
        check: () => window.NFT_SYSTEM && window.NFT_SYSTEM.state && window.NFT_SYSTEM.state.ownedSkins.length >= 3
    }
};

// Initialize game
function initGame() {
    console.log('Initializing game...');
    
    // Initialize click counter
    const clickCounter = document.createElement('div');
    clickCounter.id = 'clickCounter';
    clickCounter.textContent = '0';
    document.body.appendChild(clickCounter);
    
    loadGame();
    setupEventListeners();
    startGameLoop();
    
    // Initialize NFT system if available
    if (window.NFT_SYSTEM) {
        try {
            window.NFT_SYSTEM.init();
            updateNFTDisplay();
        } catch (error) {
            console.error('Error initializing NFT system:', error);
        }
    }
    
    updateDisplay();
}

// Handle fish click
function handleFishClick() {
    console.log('Fish clicked!');
    
    // Update game state
    const clickValue = gameState.clickValue * gameState.prestigeMultiplier;
    gameState.bubbles += clickValue;
    gameState.clickCount++;
    
    // Update click counter
    const clickCounter = document.getElementById('clickCounter');
    if (clickCounter) {
        clickCounter.textContent = gameState.clickCount.toLocaleString();
    }
    
    // Visual and sound effects
    createBubbleParticle();
    playSound('click');
    
    // Update display and save
    updateDisplay();
    checkAchievements();
    saveGame();
}

// Create bubble particle effect
function createBubbleParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = '🫧';
    
    const fish = document.getElementById('mainFish');
    const fishRect = fish.getBoundingClientRect();
    
    particle.style.left = `${fishRect.left + Math.random() * fishRect.width}px`;
    particle.style.top = `${fishRect.top + Math.random() * fishRect.height}px`;
    
    document.getElementById('particles').appendChild(particle);
    
    particle.addEventListener('animationend', () => particle.remove());
}

// Game loop
function startGameLoop() {
    setInterval(() => {
        const now = Date.now();
        const delta = (now - gameState.lastSave) / 1000;
        gameState.lastSave = now;
        
        updateDisplay();
        saveGame();
    }, 1000);
}

// Update display
function updateDisplay() {
    document.getElementById('bubbles').textContent = Math.floor(gameState.bubbles);
    document.getElementById('pearls').textContent = gameState.pearls;
    document.getElementById('prestigeLevel').textContent = gameState.prestigeLevel;
    document.getElementById('nextPrestigeBonus').textContent = `+${(gameState.prestigeLevel + 1) * 5}%`;
    
    updateShop();
    updateNFTDisplay();
}

// Switch tabs
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const tabContent = document.getElementById(tabId);
    const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
    
    if (tabContent && tabButton) {
        tabContent.classList.add('active');
        tabButton.classList.add('active');
    }
}

// Save and load system
function saveGame() {
    localStorage.setItem('fishClickerSave', JSON.stringify(gameState));
}

function loadGame() {
    const savedGame = localStorage.getItem('fishClickerSave');
    if (savedGame) {
        const loadedState = JSON.parse(savedGame);
        loadedState.clickCount = loadedState.clickCount || 0;
        gameState = loadedState;
        
        // Update click counter with loaded value
        const clickCounter = document.getElementById('clickCounter');
        if (clickCounter) {
            clickCounter.textContent = gameState.clickCount.toLocaleString();
        }
    }
    updateDisplay();
}

// Achievement system
function checkAchievements() {
    Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (!gameState.achievements.includes(achievement.id) && achievement.check()) {
            unlockAchievement(achievement);
        }
    });
}

function unlockAchievement(achievement) {
    gameState.achievements.push(achievement.id);
    showAchievementPopup(achievement);
    playSound('achievement');
    saveGame();
}

function showAchievementPopup(achievement) {
    const popup = document.getElementById('achievementPopup');
    document.getElementById('achievementText').textContent = achievement.name;
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// Update shop display
function updateShop() {
    // Update upgrades shop
    const upgradeShop = document.getElementById('upgradeItems');
    upgradeShop.innerHTML = '';
    
    Object.entries(UPGRADE_TYPES).forEach(([key, upgrade]) => {
        if (!gameState.upgrades.includes(key)) {
            const item = document.createElement('div');
            item.className = 'shop-item';
            if (gameState.bubbles < upgrade.basePrice) item.className += ' disabled';
            
            item.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
                <p>Cost: ${upgrade.basePrice} bubbles</p>
            `;
            
            if (gameState.bubbles >= upgrade.basePrice) {
                item.addEventListener('click', () => purchaseUpgrade(key));
            }
            
            upgradeShop.appendChild(item);
        }
    });
}

// Purchase upgrade
function purchaseUpgrade(upgradeId) {
    const upgrade = UPGRADE_TYPES[upgradeId];
    
    if (gameState.bubbles >= upgrade.basePrice && !gameState.upgrades.includes(upgradeId)) {
        gameState.bubbles -= upgrade.basePrice;
        gameState.upgrades.push(upgradeId);
        upgrade.effect();
        
        playSound('purchase');
        updateDisplay();
        saveGame();
        checkAchievements();
    }
}

// Auto clicker functionality
let autoClickerInterval;

function startAutoClicker() {
    if (!autoClickerInterval) {
        autoClickerInterval = setInterval(() => {
            handleFishClick();
        }, 10000);
    }
}

// Update NFT display
function updateNFTDisplay() {
    try {
        // Update NFT inventory
        const inventory = document.getElementById('nftInventory');
        if (!inventory) return;
        inventory.innerHTML = '';
        
        if (window.NFT_SYSTEM && window.NFT_SYSTEM.state) {
            window.NFT_SYSTEM.state.ownedSkins.forEach(skin => {
                const card = document.createElement('div');
                card.className = `nft-skin-card${skin.id === window.NFT_SYSTEM.state.activeSkin ? ' active' : ''}`;
                
                card.innerHTML = `
                    <img src="${skin.image}" alt="${skin.name}">
                    <h3>${skin.name}</h3>
                    <p class="rarity ${skin.rarity}">${skin.rarity.toUpperCase()}</p>
                `;
                
                card.addEventListener('click', () => equipSkin(skin.id));
                inventory.appendChild(card);
            });
        }
        
        // Update weekly shop - only update if empty
        const weeklyShop = document.getElementById('weeklyShop');
        if (!weeklyShop || weeklyShop.children.length > 0) return;
        
        if (window.NFT_SYSTEM && window.NFT_SYSTEM.shop) {
            const currentRotation = window.NFT_SYSTEM.shop.getCurrentRotation();
            currentRotation.forEach(skinId => {
                // Find the skin in the NFT_SYSTEM.skins catalog
                let skin = null;
                for (const rarity in window.NFT_SYSTEM.skins) {
                    if (window.NFT_SYSTEM.skins[rarity][skinId]) {
                        skin = window.NFT_SYSTEM.skins[rarity][skinId];
                        break;
                    }
                }
                
                if (skin) {
                    const card = document.createElement('div');
                    card.className = 'shop-nft-card';
                    
                    card.innerHTML = `
                        <img src="${skin.image}" alt="${skin.name}">
                        <h3>${skin.name}</h3>
                        <p class="rarity ${skin.rarity}">${skin.rarity.toUpperCase()}</p>
                        <p>${skin.description}</p>
                        <div class="nft-price">1 USDC</div>
                        <button class="mint-button" onclick="nftSystem.mintSkin('${skinId}')">Mint NFT</button>
                    `;
                    
                    weeklyShop.appendChild(card);
                }
            });
        }
    } catch (error) {
        console.error('Error updating NFT display:', error);
    }
}

// Equip NFT skin
function equipSkin(skinId) {
    const skin = window.NFT_SYSTEM.state.ownedSkins.find(s => s.id === skinId);
    if (skin) {
        // Remove previous skin's boost
        if (window.NFT_SYSTEM.state.activeSkin) {
            const oldSkin = window.NFT_SYSTEM.state.ownedSkins.find(s => s.id === window.NFT_SYSTEM.state.activeSkin);
            if (oldSkin) {
                gameState.clickValue /= oldSkin.boostMultiplier;
            }
        }
        
        // Apply new skin's boost
        window.NFT_SYSTEM.state.activeSkin = skinId;
        gameState.clickValue *= skin.boostMultiplier;
        
        // Update fish appearance
        document.getElementById('mainFishImg').src = skin.image;
        
        updateDisplay();
        saveGame();
    }
}

// Helper function to show errors
function showError(message) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <div class="achievement-content">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

// Event listeners
function setupEventListeners() {
    // Main fish click
    const mainFish = document.getElementById('mainFish');
    if (mainFish) {
        mainFish.addEventListener('click', handleFishClick);
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Prestige button
    const prestigeButton = document.getElementById('prestigeButton');
    if (prestigeButton) {
        prestigeButton.addEventListener('click', prestige);
    }

    // Add sound toggle listener
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            isSoundMuted = !isSoundMuted;
            soundToggle.textContent = isSoundMuted ? '🔇' : '🔊';
            soundToggle.classList.toggle('muted', isSoundMuted);
            
            if (!isSoundMuted && audioContext?.state === 'suspended') {
                audioContext.resume();
            }
        });
    }
}

// Prestige system
function prestige() {
    if (gameState.bubbles < 10000) return;
    
    const pearlsToEarn = Math.floor(Math.log10(gameState.bubbles) - 3);
    
    if (confirm(`Are you sure you want to prestige? You will earn ${pearlsToEarn} pearls!`)) {
        gameState.pearls += pearlsToEarn;
        gameState.prestigeLevel++;
        gameState.prestigeMultiplier = 1 + (gameState.prestigeLevel * 0.05);
        
        // Reset game state
        gameState.bubbles = 0;
        gameState.upgrades = [];
        gameState.clickValue = 1;
        
        playSound('prestige');
        updateDisplay();
        saveGame();
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded...');
    initAudio(); // Initialize audio system first
    
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
        console.log('Starting game initialization...');
        initGame();
    }, 100);
}); 