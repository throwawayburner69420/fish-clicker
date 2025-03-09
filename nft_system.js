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

// Activity Tracking
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
function checkForNFTDrop() {
    if (playerNFTState.activePlayTime >= NFT_CONFIG.DROP_INTERVAL) {
        const today = new Date().toDateString();
        
        if (playerNFTState.lastDrop !== today) {
            playerNFTState.dropCount = 0;
        }
        
        if (playerNFTState.dropCount < NFT_CONFIG.LIMITS.DAILY_DROPS) {
            generateRandomSkinDrop();
            playerNFTState.activePlayTime = 0;
            playerNFTState.lastDrop = today;
            playerNFTState.dropCount++;
            saveNFTState();
        }
    }
}

function generateRandomSkinDrop() {
    const roll = Math.random();
    let selectedSkin = null;
    
    if (roll < NFT_CONFIG.DROP_RATES.LEGENDARY) {
        selectedSkin = getRandomSkinFromRarity('LEGENDARY');
    } else if (roll < NFT_CONFIG.DROP_RATES.LEGENDARY + NFT_CONFIG.DROP_RATES.RARE) {
        selectedSkin = getRandomSkinFromRarity('RARE');
    } else {
        selectedSkin = getRandomSkinFromRarity('COMMON');
    }
    
    if (selectedSkin) {
        mintNFTSkin(selectedSkin);
    }
}

function getRandomSkinFromRarity(rarity) {
    const skins = Object.values(NFT_FISH_SKINS[rarity]);
    return skins[Math.floor(Math.random() * skins.length)];
}

// NFT Minting (to be connected to blockchain)
async function mintNFTSkin(skin) {
    try {
        // This would connect to your blockchain contract
        console.log(`Minting NFT: ${skin.name}`);
        
        // For now, we'll just add it to the player's state
        playerNFTState.ownedSkins.push({
            id: `${skin.id}_${Date.now()}`,
            ...skin,
            mintDate: new Date().toISOString()
        });
        
        saveNFTState();
        showNFTDropPopup(skin);
    } catch (error) {
        console.error('Error minting NFT:', error);
    }
}

// UI Functions
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
            <p>Boost: ${(skin.boostMultiplier - 1) * 100}% Click Value</p>
            <button onclick="this.parentElement.parentElement.remove()">Awesome!</button>
        </div>
    `;
    document.body.appendChild(popup);
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

// Initialize NFT System
function initNFTSystem() {
    loadNFTState();
    setInterval(updateActivePlayTime, NFT_CONFIG.ACTIVE_CHECK_INTERVAL);
}

// Export functions and constants
window.NFT_SYSTEM = {
    init: initNFTSystem,
    config: NFT_CONFIG,
    skins: NFT_FISH_SKINS,
    shop: WEEKLY_SHOP,
    state: playerNFTState
}; 