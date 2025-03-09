// NFT System Configuration
const NFT_CONFIG = {
    DROP_RATES: {
        COMMON: 0.80,    // 80% chance
        RARE: 0.15,      // 15% chance
        LEGENDARY: 0.05   // 5% chance
    },
    LIMITS: {
        DAILY_DROPS: 24,
        WEEKLY_PURCHASES: 3
    },
    ACTIVE_CHECK_INTERVAL: 60000, // Check activity every minute
    INACTIVE_THRESHOLD: 300000,   // 5 minutes of inactivity
    DROP_INTERVAL: 3600000        // 1 hour for drops
};

// NFT Fish Skin Catalog
const NFT_FISH_SKINS = {
    COMMON: {
        NEON_FISH: {
            id: 'neon_fish',
            name: 'Neon Fish',
            rarity: 'common',
            boostMultiplier: 1.1,
            description: 'A vibrant, glowing fish that lights up the deep',
            image: 'assets/skins/neon_fish.png'
        },
        PIXEL_FISH: {
            id: 'pixel_fish',
            name: 'Pixel Fish',
            rarity: 'common',
            boostMultiplier: 1.1,
            description: 'A retro-styled fish from the 8-bit era',
            image: 'assets/skins/pixel_fish.png'
        }
    },
    RARE: {
        GOLDEN_FISH: {
            id: 'golden_fish',
            name: 'Golden Fish',
            rarity: 'rare',
            boostMultiplier: 1.25,
            description: 'A magnificent golden fish that brings prosperity',
            image: 'assets/skins/golden_fish.png'
        },
        CRYSTAL_FISH: {
            id: 'crystal_fish',
            name: 'Crystal Fish',
            rarity: 'rare',
            boostMultiplier: 1.25,
            description: 'A translucent fish made of pure crystal',
            image: 'assets/skins/crystal_fish.png'
        }
    },
    LEGENDARY: {
        RAINBOW_FISH: {
            id: 'rainbow_fish',
            name: 'Rainbow Fish',
            rarity: 'legendary',
            boostMultiplier: 1.5,
            description: 'A mythical fish that radiates prismatic energy',
            image: 'assets/skins/rainbow_fish.png'
        }
    }
};

// Weekly Shop Rotation
const WEEKLY_SHOP = {
    getCurrentRotation: () => {
        const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
        const rotations = [
            ['NEON_FISH', 'GOLDEN_FISH'],
            ['PIXEL_FISH', 'CRYSTAL_FISH'],
            ['RAINBOW_FISH'],
            ['GOLDEN_FISH', 'PIXEL_FISH']
        ];
        return rotations[currentWeek % rotations.length];
    }
};

// Player NFT State
let playerNFTState = {
    ownedSkins: [],
    activeSkin: null,
    lastDrop: null,
    dropCount: 0,
    weeklyPurchases: 0,
    activePlayTime: 0,
    lastActiveCheck: Date.now()
};

// Initialize NFT System
async function initNFTSystem() {
    loadNFTState();
    setupNFTEventListeners();
    startActivityTracking();
    
    // Try to connect Abstract wallet if previously connected
    if (localStorage.getItem('abstractWalletConnected') === 'true') {
        await window.ABSTRACT_INTEGRATION.connectWallet();
    }
}

// Activity Tracking
function startActivityTracking() {
    setInterval(updateActivePlayTime, NFT_CONFIG.ACTIVE_CHECK_INTERVAL);
}

function updateActivePlayTime() {
    const now = Date.now();
    const timeDiff = now - playerNFTState.lastActiveCheck;
    
    if (timeDiff < NFT_CONFIG.INACTIVE_THRESHOLD) {
        playerNFTState.activePlayTime += timeDiff;
        checkForNFTDrop();
    }
    
    playerNFTState.lastActiveCheck = now;
    saveNFTState();
}

// NFT Drop System
async function checkForNFTDrop() {
    const now = Date.now();
    if (!playerNFTState.lastDrop || (now - playerNFTState.lastDrop) >= NFT_CONFIG.DROP_INTERVAL) {
        if (playerNFTState.dropCount < NFT_CONFIG.LIMITS.DAILY_DROPS) {
            const roll = Math.random();
            let rarity;
            
            if (roll < NFT_CONFIG.DROP_RATES.LEGENDARY) rarity = 'LEGENDARY';
            else if (roll < NFT_CONFIG.DROP_RATES.LEGENDARY + NFT_CONFIG.DROP_RATES.RARE) rarity = 'RARE';
            else rarity = 'COMMON';
            
            const skin = getRandomSkinFromRarity(rarity);
            await mintNFTDrop(skin);
            
            playerNFTState.lastDrop = now;
            playerNFTState.dropCount++;
            saveNFTState();
        }
    }
}

async function mintNFTDrop(skin) {
    try {
        if (!window.ABSTRACT_INTEGRATION.isConnected()) {
            showWalletConnectPrompt();
            return;
        }

        const tx = await window.ABSTRACT_INTEGRATION.mintNFT(skin);
        if (tx) {
            playerNFTState.ownedSkins.push({
                id: `${skin.id}_${Date.now()}`,
                ...skin,
                tokenId: tx.events.Transfer.returnValues.tokenId
            });
            showNFTDropPopup(skin);
            saveNFTState();
        }
    } catch (error) {
        console.error('Failed to mint NFT drop:', error);
    }
}

function getRandomSkinFromRarity(rarity) {
    const skins = Object.values(NFT_FISH_SKINS[rarity]);
    return skins[Math.floor(Math.random() * skins.length)];
}

// UI Functions
function showWalletConnectPrompt() {
    const popup = document.createElement('div');
    popup.className = 'nft-drop-popup';
    popup.innerHTML = `
        <div class="nft-drop-content">
            <h2>Connect Wallet</h2>
            <p>Please connect your Abstract wallet to receive NFT drops!</p>
            <button onclick="window.ABSTRACT_INTEGRATION.connectWallet()">Connect Wallet</button>
        </div>
    `;
    document.body.appendChild(popup);
}

function showNFTDropPopup(skin) {
    const popup = document.createElement('div');
    popup.className = 'nft-drop-popup';
    popup.innerHTML = `
        <div class="nft-drop-content">
            <h2>New NFT Fish Skin!</h2>
            <img src="${skin.image}" alt="${skin.name}">
            <h3>${skin.name}</h3>
            <p class="rarity ${skin.rarity}">${skin.rarity.toUpperCase()}</p>
            <p>${skin.description}</p>
            <p>Boost: +${(skin.boostMultiplier - 1) * 100}% Click Value</p>
            <button onclick="this.parentElement.parentElement.remove()">Awesome!</button>
        </div>
    `;
    document.body.appendChild(popup);
}

// Event Listeners
function setupNFTEventListeners() {
    document.getElementById('abstractWalletConnect').addEventListener('click', async () => {
        const connected = await window.ABSTRACT_INTEGRATION.connectWallet();
        if (connected) {
            localStorage.setItem('abstractWalletConnected', 'true');
        }
    });
}

// Save/Load NFT State
function saveNFTState() {
    localStorage.setItem('fishClickerNFTState', JSON.stringify(playerNFTState));
}

function loadNFTState() {
    const savedState = localStorage.getItem('fishClickerNFTState');
    if (savedState) {
        playerNFTState = JSON.parse(savedState);
    }
}

// Export functions and constants
window.NFT_SYSTEM = {
    init: initNFTSystem,
    config: NFT_CONFIG,
    skins: NFT_FISH_SKINS,
    shop: WEEKLY_SHOP,
    state: playerNFTState,
    equipSkin: async (skinId) => {
        const skin = playerNFTState.ownedSkins.find(s => s.id === skinId);
        if (skin) {
            playerNFTState.activeSkin = skinId;
            document.getElementById('mainFishImg').src = skin.image;
            saveNFTState();
        }
    }
}; 