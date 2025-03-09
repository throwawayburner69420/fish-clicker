// Sound System
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isSoundMuted = false;

// Create oscillator-based sounds
function createSound(type, frequency, duration, volume = 0.05) {
    if (isSoundMuted) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Softer volume and smoother envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// Create bubble sound
function createBubbleSound() {
    if (isSoundMuted) return;

    // Create multiple oscillators for a richer sound
    const mainOsc = audioContext.createOscillator();
    const subOsc = audioContext.createOscillator();
    const noiseOsc = audioContext.createOscillator();
    
    const mainGain = audioContext.createGain();
    const subGain = audioContext.createGain();
    const noiseGain = audioContext.createGain();
    
    // Create filters for shaping the sound
    const mainFilter = audioContext.createBiquadFilter();
    const subFilter = audioContext.createBiquadFilter();
    const noiseFilter = audioContext.createBiquadFilter();

    // Randomize the base frequency for variation
    const baseFreq = 400 + Math.random() * 200;
    
    // Main bubble resonance
    mainFilter.type = 'bandpass';
    mainFilter.frequency.setValueAtTime(baseFreq * 2, audioContext.currentTime);
    mainFilter.Q.value = 8;
    
    // Sub-frequency for depth
    subFilter.type = 'bandpass';
    subFilter.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
    subFilter.Q.value = 4;
    
    // Noise filter for water texture
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(baseFreq * 3, audioContext.currentTime);
    noiseFilter.Q.value = 2;

    // Configure oscillators
    mainOsc.type = 'sine';
    mainOsc.frequency.setValueAtTime(baseFreq * 2, audioContext.currentTime);
    mainOsc.frequency.exponentialRampToValueAtTime(baseFreq, audioContext.currentTime + 0.1);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, audioContext.currentTime + 0.15);

    noiseOsc.type = 'sawtooth';
    noiseOsc.frequency.setValueAtTime(baseFreq * 3, audioContext.currentTime);

    // Set up gain envelopes
    mainGain.gain.setValueAtTime(0, audioContext.currentTime);
    mainGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
    mainGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);

    subGain.gain.setValueAtTime(0, audioContext.currentTime);
    subGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

    noiseGain.gain.setValueAtTime(0, audioContext.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    // Connect nodes
    mainOsc.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(audioContext.destination);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(audioContext.destination);

    noiseOsc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);

    // Start and stop all oscillators
    const startTime = audioContext.currentTime;
    const duration = 0.2 + Math.random() * 0.1;
    
    mainOsc.start(startTime);
    subOsc.start(startTime);
    noiseOsc.start(startTime);
    
    mainOsc.stop(startTime + duration);
    subOsc.stop(startTime + duration);
    noiseOsc.stop(startTime + duration);

    // Add a small chance of a secondary bubble sound
    if (Math.random() < 0.3) {
        setTimeout(() => {
            const smallerDuration = 0.1;
            const smallOsc = audioContext.createOscillator();
            const smallGain = audioContext.createGain();
            const smallFilter = audioContext.createBiquadFilter();

            smallFilter.type = 'bandpass';
            smallFilter.frequency.setValueAtTime(baseFreq * 1.5, audioContext.currentTime);
            smallFilter.Q.value = 6;

            smallOsc.type = 'sine';
            smallOsc.frequency.setValueAtTime(baseFreq * 1.5, audioContext.currentTime);
            smallOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, audioContext.currentTime + smallerDuration);

            smallGain.gain.setValueAtTime(0, audioContext.currentTime);
            smallGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            smallGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + smallerDuration);

            smallOsc.connect(smallFilter);
            smallFilter.connect(smallGain);
            smallGain.connect(audioContext.destination);

            smallOsc.start(audioContext.currentTime);
            smallOsc.stop(audioContext.currentTime + smallerDuration);
        }, Math.random() * 100);
    }
}

// Function to play sound
function playSound(soundName) {
    switch(soundName) {
        case 'click':
            // Bubble pop sound
            createBubbleSound();
            break;
        case 'purchase':
            // Happy purchase sound
            setTimeout(() => createSound('sine', 600, 0.1, 0.02), 0);
            setTimeout(() => createSound('sine', 800, 0.1, 0.02), 50);
            break;
        case 'achievement':
            // Gentle achievement melody
            setTimeout(() => createSound('sine', 600, 0.1, 0.02), 0);
            setTimeout(() => createSound('sine', 700, 0.1, 0.02), 100);
            setTimeout(() => createSound('sine', 900, 0.15, 0.02), 200);
            break;
        case 'prestige':
            // Soft prestige melody
            setTimeout(() => createSound('sine', 500, 0.15, 0.02), 0);
            setTimeout(() => createSound('sine', 600, 0.15, 0.02), 150);
            setTimeout(() => createSound('sine', 700, 0.15, 0.02), 300);
            setTimeout(() => createSound('sine', 900, 0.2, 0.02), 450);
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
    achievements: []
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
    loadGame();
    setupEventListeners();
    startGameLoop();
    window.NFT_SYSTEM.init(); // Initialize NFT system
    updateNFTDisplay();
}

// Event listeners
function setupEventListeners() {
    // Main fish click
    document.getElementById('mainFish').addEventListener('click', handleFishClick);

    // Tab switching - Fix the event listeners
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            console.log('Switching to tab:', tabId); // Debug log
            switchTab(tabId);
        });
    });

    // Prestige button
    document.getElementById('prestigeButton').addEventListener('click', prestige);

    // Add sound toggle listener
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.addEventListener('click', () => {
        isSoundMuted = !isSoundMuted;
        soundToggle.textContent = isSoundMuted ? '🔇' : '🔊';
        soundToggle.classList.toggle('muted', isSoundMuted);
        playSound('click');
    });

    // Register click as activity for NFT drops
    document.addEventListener('click', () => {
        window.NFT_SYSTEM.state.lastActiveCheck = Date.now();
    });
}

// Handle fish click
function handleFishClick() {
    const clickValue = gameState.clickValue * gameState.prestigeMultiplier;
    gameState.bubbles += clickValue;
    createBubbleParticle();
    playSound('click');
    updateDisplay();
    checkAchievements();
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
    
    // Fix the tab ID matching
    const tabContent = document.getElementById(`${tabId}Shop`);
    const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
    
    if (tabContent && tabButton) {
        tabContent.classList.add('active');
        tabButton.classList.add('active');
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

// Save and load system
function saveGame() {
    localStorage.setItem('fishClickerSave', JSON.stringify(gameState));
}

function loadGame() {
    const savedGame = localStorage.getItem('fishClickerSave');
    if (savedGame) {
        gameState = JSON.parse(savedGame);
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
                    <p>Boost: +${(skin.boostMultiplier - 1) * 100}%</p>
                `;
                
                card.addEventListener('click', () => equipSkin(skin.id));
                inventory.appendChild(card);
            });
        }
        
        // Update weekly shop
        const weeklyShop = document.getElementById('weeklyShop');
        if (!weeklyShop) return;
        weeklyShop.innerHTML = '';
        
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
                        <p>Boost: +${(skin.boostMultiplier - 1) * 100}%</p>
                        <button onclick="purchaseNFTSkin('${skinId}')" 
                                ${window.NFT_SYSTEM.state.weeklyPurchases >= window.NFT_SYSTEM.config.LIMITS.WEEKLY_PURCHASES ? 'disabled' : ''}>
                            Purchase
                        </button>
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

// Purchase NFT skin from weekly shop
function purchaseNFTSkin(skinId) {
    try {
        // Find the skin in the NFT_SYSTEM.skins catalog
        let skin = null;
        let skinRarity = null;
        
        for (const rarity in window.NFT_SYSTEM.skins) {
            if (window.NFT_SYSTEM.skins[rarity][skinId]) {
                skin = window.NFT_SYSTEM.skins[rarity][skinId];
                skinRarity = rarity;
                break;
            }
        }
        
        if (skin && window.NFT_SYSTEM.state.weeklyPurchases < window.NFT_SYSTEM.config.LIMITS.WEEKLY_PURCHASES) {
            // This would normally involve blockchain transaction
            window.NFT_SYSTEM.state.weeklyPurchases++;
            window.NFT_SYSTEM.state.ownedSkins.push({
                id: `${skin.id}_${Date.now()}`,
                ...skin,
                mintDate: new Date().toISOString()
            });
            
            playSound('purchase');
            updateDisplay();
            window.NFT_SYSTEM.saveNFTState();
        }
    } catch (error) {
        console.error('Error purchasing NFT skin:', error);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame); 