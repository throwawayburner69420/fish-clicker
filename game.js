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

// Function to play sound
function playSound(soundName) {
    switch(soundName) {
        case 'click':
            // Soft, pleasant click
            createSound('sine', 800, 0.05, 0.03); // Higher pitch, shorter duration, quieter
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
    fish: [],
    upgrades: [],
    achievements: []
};

// Fish types
const FISH_TYPES = {
    CLOWNFISH: {
        id: 'clownfish',
        name: 'Clownfish',
        basePrice: 10,
        incomePerSecond: 0.1,
        description: 'A friendly clownfish that generates bubbles!'
    },
    ANGELFISH: {
        id: 'angelfish',
        name: 'Angelfish',
        basePrice: 50,
        incomePerSecond: 0.5,
        description: 'Majestic angelfish with enhanced bubble production'
    },
    PUFFERFISH: {
        id: 'pufferfish',
        name: 'Pufferfish',
        basePrice: 200,
        incomePerSecond: 2,
        description: 'Inflates to produce lots of bubbles!'
    },
    SHARK: {
        id: 'shark',
        name: 'Shark',
        basePrice: 1000,
        incomePerSecond: 10,
        description: 'A powerful shark that generates tons of bubbles!'
    }
};

// Upgrade types
const UPGRADE_TYPES = {
    GOLDEN_HOOK: {
        id: 'golden_hook',
        name: 'Golden Hook',
        basePrice: 100,
        effect: () => { 
            gameState.clickValue *= 2;
            updateDisplay();
        },
        description: 'Doubles your click value'
    },
    AUTO_CLICKER: {
        id: 'auto_clicker',
        name: 'Auto-Clicker Crab',
        basePrice: 500,
        effect: () => { 
            startAutoClicker();
            updateDisplay();
        },
        description: 'Automatically clicks every 5 seconds'
    },
    BUBBLE_MULTIPLIER: {
        id: 'bubble_multiplier',
        name: 'Bubble Multiplier',
        basePrice: 1000,
        effect: () => {
            gameState.clickValue *= 3;
            updateDisplay();
        },
        description: 'Triples your click value'
    }
};

// Achievement types
const ACHIEVEMENTS = {
    BUBBLE_MASTER: {
        id: 'bubble_master',
        name: 'Bubble Master',
        description: 'Earn 1,000 bubbles in total',
        check: () => gameState.bubbles >= 1000
    },
    FISH_COLLECTOR: {
        id: 'fish_collector',
        name: 'Fish Collector',
        description: 'Own 5 different fish',
        check: () => gameState.fish.length >= 5
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
        
        // Calculate idle income
        let idleIncome = 0;
        gameState.fish.forEach(fish => {
            idleIncome += FISH_TYPES[fish.type].incomePerSecond * fish.count;
        });
        
        gameState.bubbles += idleIncome * delta * gameState.prestigeMultiplier;
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
    document.getElementById('nextPrestigeBonus').textContent = `+${(gameState.prestigeLevel + 1) * 10}%`;
    
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
    if (gameState.bubbles < 1000) return;
    
    const pearlsToEarn = Math.floor(Math.log10(gameState.bubbles));
    
    if (confirm(`Are you sure you want to prestige? You will earn ${pearlsToEarn} pearls!`)) {
        gameState.pearls += pearlsToEarn;
        gameState.prestigeLevel++;
        gameState.prestigeMultiplier = 1 + (gameState.prestigeLevel * 0.1);
        
        // Reset game state
        gameState.bubbles = 0;
        gameState.fish = [];
        gameState.upgrades = [];
        
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
    // Update fish shop
    const fishShop = document.getElementById('fishItems');
    fishShop.innerHTML = '';
    
    Object.entries(FISH_TYPES).forEach(([key, fish]) => {
        const owned = gameState.fish.find(f => f.type === key) || { count: 0 };
        const price = Math.floor(fish.basePrice * Math.pow(1.15, owned.count));
        
        const item = document.createElement('div');
        item.className = 'shop-item';
        if (gameState.bubbles < price) item.className += ' disabled';
        
        item.innerHTML = `
            <h3>${fish.name}</h3>
            <p>${fish.description}</p>
            <p>Cost: ${price} bubbles</p>
            <p>Income: ${fish.incomePerSecond}/sec</p>
            <p>Owned: ${owned.count}</p>
        `;
        
        if (gameState.bubbles >= price) {
            item.addEventListener('click', () => purchaseFish(key));
        }
        
        fishShop.appendChild(item);
    });
    
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

// Purchase fish
function purchaseFish(fishId) {
    const fish = FISH_TYPES[fishId];
    const owned = gameState.fish.find(f => f.type === fishId);
    const price = Math.floor(fish.basePrice * Math.pow(1.15, owned ? owned.count : 0));
    
    if (gameState.bubbles >= price) {
        gameState.bubbles -= price;
        
        if (owned) {
            owned.count++;
        } else {
            gameState.fish.push({ type: fishId, count: 1 });
        }
        
        playSound('purchase');
        updateDisplay();
        saveGame();
        checkAchievements();
    }
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
        }, 5000);
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