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

// Event listeners
function setupEventListeners() {
    // Main fish click
    document.getElementById('mainFish').addEventListener('click', handleFishClick);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Prestige button
    document.getElementById('prestigeButton').addEventListener('click', prestige);

    // Add sound toggle listener
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            isSoundMuted = !isSoundMuted;
            soundToggle.textContent = isSoundMuted ? '🔇' : '🔊';
            soundToggle.classList.toggle('muted', isSoundMuted);
            
            // Resume audio context if unmuting
            if (!isSoundMuted && audioContext?.state === 'suspended') {
                audioContext.resume();
            }
        });
    }

    // Wallet connect button
    const connectButton = document.getElementById('abstractWalletConnect');
    if (connectButton) {
        // Ensure button has proper structure
        if (!connectButton.querySelector('.wallet-btn-text')) {
            connectButton.innerHTML = `
                <span class="wallet-btn-text">Connect Wallet</span>
                <span class="wallet-btn-loading" style="display: none;">Connecting...</span>
            `;
        }

        // Force enable the button
        connectButton.removeAttribute('disabled');
        connectButton.style.pointerEvents = 'auto';
        connectButton.style.cursor = 'pointer';

        connectButton.addEventListener('click', async () => {
            console.log('Wallet button clicked'); // Debug log
            try {
                const btnText = connectButton.querySelector('.wallet-btn-text');
                const btnLoading = connectButton.querySelector('.wallet-btn-loading');
                
                // Show loading state
                connectButton.classList.add('loading');
                btnText.style.display = 'none';
                btnLoading.style.display = 'block';
                
                // Check if already connected - if so, disconnect
                if (window.privyWalletManager?.isConnected()) {
                    console.log('Attempting to disconnect wallet'); // Debug log
                    try {
                        await window.privyWalletManager.disconnect();
                        btnText.textContent = 'Connect Wallet';
                        connectButton.classList.remove('connected');
                        localStorage.removeItem('abstractWalletConnected');
                        console.log('Wallet disconnected successfully'); // Debug log
                    } catch (disconnectError) {
                        console.error('Error disconnecting wallet:', disconnectError);
                        showError('Failed to disconnect wallet. Please try again.');
                    }
                    return;
                }

                // Connect using Privy to manage Abstract wallet
                if (!window.privyWalletManager) {
                    throw new Error('Privy wallet manager not initialized');
                }

                console.log('Attempting to connect wallet'); // Debug log
                await window.privyWalletManager.connect();
                
                // Update button text to show connected state
                const address = await window.privyWalletManager.getAddress();
                if (address) {
                    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
                    btnText.textContent = shortAddress;
                    connectButton.classList.add('connected');
                    localStorage.setItem('abstractWalletConnected', 'true');
                    console.log('Wallet connected successfully:', shortAddress); // Debug log
                }

            } catch (error) {
                console.error('Error managing wallet connection:', error);
                showError('Failed to manage wallet connection. Please try again.');
                const btnText = connectButton.querySelector('.wallet-btn-text');
                btnText.textContent = 'Connect Wallet';
                connectButton.classList.remove('connected');
            } finally {
                // Remove loading state
                const btnText = connectButton.querySelector('.wallet-btn-text');
                const btnLoading = connectButton.querySelector('.wallet-btn-loading');
                connectButton.classList.remove('loading');
                btnText.style.display = 'block';
                btnLoading.style.display = 'none';
                
                // Ensure button remains clickable
                connectButton.removeAttribute('disabled');
                connectButton.style.pointerEvents = 'auto';
                connectButton.style.cursor = 'pointer';
            }
        });

        // Check initial connection state
        if (window.privyWalletManager?.isConnected()) {
            window.privyWalletManager.getAddress().then(address => {
                if (address) {
                    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
                    const btnText = connectButton.querySelector('.wallet-btn-text');
                    btnText.textContent = shortAddress;
                    connectButton.classList.add('connected');
                    // Ensure button remains clickable
                    connectButton.removeAttribute('disabled');
                    connectButton.style.pointerEvents = 'auto';
                    connectButton.style.cursor = 'pointer';
                }
            }).catch(console.error);
        }
    }

    // Register click as activity for NFT drops
    document.addEventListener('click', () => {
        if (window.NFT_SYSTEM?.state) {
            window.NFT_SYSTEM.state.lastActiveCheck = Date.now();
        }
    });
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
    clickCount: 0 // Add click counter to game state
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
    
    // Add click counter to the fish
    const mainFish = document.getElementById('mainFish');
    if (mainFish) {
        const counter = document.createElement('div');
        counter.id = 'clickCounter';
        counter.className = 'click-counter';
        counter.textContent = gameState.clickCount.toLocaleString();
        mainFish.appendChild(counter);
    }
}

// Handle fish click
function handleFishClick() {
    const clickValue = gameState.clickValue * gameState.prestigeMultiplier;
    gameState.bubbles += clickValue;
    gameState.clickCount++; // Increment click counter
    
    // Update click counter display
    const counter = document.getElementById('clickCounter');
    if (counter) {
        counter.textContent = gameState.clickCount.toLocaleString();
    }
    
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
        const loadedState = JSON.parse(savedGame);
        // Ensure clickCount is initialized even if loading old save
        loadedState.clickCount = loadedState.clickCount || 0;
        gameState = loadedState;
    }
    updateDisplay();
    
    // Update click counter if it exists
    const counter = document.getElementById('clickCounter');
    if (counter) {
        counter.textContent = gameState.clickCount.toLocaleString();
    }
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

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('Game initializing...');
    initAudio(); // Initialize audio system first
    initGame();
}); 