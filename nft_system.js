// NFT System Configuration
const NFT_CONFIG = {
    DROP_RATES: {
        NORMAL: 0.70,      // 70% chance
        COMMON: 0.25,      // 25% chance
        UNCOMMON: 0.0489,  // 4.89% chance
        RARE: 0.001,       // 0.1% chance
        EPIC: 0.0001,      // 0.01% chance
        ULTRA_RARE: 0.0000025, // 1 in 400,000
        LEGENDARY: 0.0000001   // 1 in 10,000,000
    },
    LIMITS: {
        DAILY_DROPS: 24,
        WEEKLY_PURCHASES: 3
    },
    DROP_INTERVAL: 10800000,  // 3 hours in milliseconds
    ACTIVE_CHECK_INTERVAL: 60000, // Check activity every minute
    INACTIVE_THRESHOLD: 300000    // 5 minutes of inactivity
};

// NFT Fish Skin Catalog
const NFT_FISH_SKINS = {
    NORMAL: {
        BASIC_FISH: {
            id: 'basic_fish',
            name: 'Basic Fish',
            rarity: 'normal',
            description: 'A regular fish swimming in the sea',
            image: 'assets/skins/basic_fish.png',
            available: false // Artwork needed
        }
    },
    COMMON: {
        NEON_FISH: {
            id: 'neon_fish',
            name: 'Neon Fish',
            rarity: 'common',
            description: 'A vibrant, glowing fish that lights up the deep',
            image: 'assets/skins/neon_fish.png',
            available: true
        },
        PIXEL_FISH: {
            id: 'pixel_fish',
            name: 'Pixel Fish',
            rarity: 'common',
            description: 'A retro-styled fish from the 8-bit era',
            image: 'assets/skins/pixel_fish.png',
            available: true
        }
    },
    UNCOMMON: {
        ROBOT_FISH: {
            id: 'robot_fish',
            name: 'Robot Fish',
            rarity: 'uncommon',
            description: 'A mechanical fish with gears and circuits',
            image: 'assets/skins/robot_fish.png',
            available: false // Artwork needed
        }
    },
    RARE: {
        GOLDEN_FISH: {
            id: 'golden_fish',
            name: 'Golden Fish',
            rarity: 'rare',
            description: 'A magnificent golden fish that brings prosperity',
            image: 'assets/skins/golden_fish.png',
            available: true
        }
    },
    EPIC: {
        CRYSTAL_FISH: {
            id: 'crystal_fish',
            name: 'Crystal Fish',
            rarity: 'epic',
            description: 'A translucent fish made of pure crystal',
            image: 'assets/skins/crystal_fish.png',
            available: true
        }
    },
    ULTRA_RARE: {
        GALAXY_FISH: {
            id: 'galaxy_fish',
            name: 'Galaxy Fish',
            rarity: 'ultra_rare',
            description: 'A cosmic fish containing an entire universe within',
            image: 'assets/skins/galaxy_fish.png',
            available: false // Artwork needed
        }
    },
    LEGENDARY: {
        RAINBOW_FISH: {
            id: 'rainbow_fish',
            name: 'Rainbow Fish',
            rarity: 'legendary',
            description: 'A mythical fish that radiates prismatic energy',
            image: 'assets/skins/rainbow_fish.png',
            available: true
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

class NFTSystem {
    constructor() {
        this.ownedSkins = new Set();
        this.activeSkin = null;
        this.initializeWeeklyShop();
    }

    initializeWeeklyShop() {
        const shopContainer = document.querySelector('#weeklyShop');
        if (!shopContainer) {
            console.error('Weekly shop container not found');
            return;
        }

        // Only clear and reinitialize if the container is empty
        if (shopContainer.children.length === 0) {
            // Directly display Golden Fish and Rainbow Fish
            const displaySkins = [
                NFT_FISH_SKINS.RARE.GOLDEN_FISH,
                NFT_FISH_SKINS.LEGENDARY.RAINBOW_FISH
            ];
            
            displaySkins.forEach(skin => {
                const card = document.createElement('div');
                card.className = 'shop-nft-card';
                card.innerHTML = `
                    <img src="${skin.image}" alt="${skin.name}">
                    <div class="nft-name">${skin.name}</div>
                    <div class="nft-description">${skin.description}</div>
                    <div class="nft-rarity ${skin.rarity}">${skin.rarity.toUpperCase()}</div>
                    <div class="nft-price">1 USDC</div>
                    <button class="mint-button" onclick="nftSystem.mintSkin('${skin.id}')">Buy</button>
                `;
                shopContainer.appendChild(card);
            });
        }
    }

    async mintSkin(skinId) {
        // Find the skin in the NFT catalog
        let skin;
        for (const rarity in NFT_FISH_SKINS) {
            for (const key in NFT_FISH_SKINS[rarity]) {
                if (NFT_FISH_SKINS[rarity][key].id === skinId) {
                    skin = NFT_FISH_SKINS[rarity][key];
                    break;
                }
            }
            if (skin) break;
        }
        
        if (!skin) return;
        
        // Check if connected to wallet
        if (!window.privyWalletManager?.isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            // Simulate minting process
            const button = event.target;
            button.disabled = true;
            button.textContent = 'Minting...';
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.ownedSkins.add(skinId);
            this.updateInventory();
            
            button.textContent = 'Minted!';
        } catch (error) {
            console.error('Failed to mint NFT:', error);
            button.textContent = 'Mint Failed';
        }
    }

    updateInventory() {
        const inventoryGrid = document.querySelector('.nft-inventory-grid');
        if (!inventoryGrid) return;

        inventoryGrid.innerHTML = '';
        
        this.ownedSkins.forEach(skinId => {
            // Find skin in NFT catalog
            let skin;
            for (const rarity in NFT_FISH_SKINS) {
                for (const key in NFT_FISH_SKINS[rarity]) {
                    if (NFT_FISH_SKINS[rarity][key].id === skinId) {
                        skin = NFT_FISH_SKINS[rarity][key];
                        break;
                    }
                }
                if (skin) break;
            }
            
            if (!skin) return;
            
            const card = document.createElement('div');
            card.className = `nft-skin-card ${this.activeSkin === skinId ? 'active' : ''}`;
            card.innerHTML = `
                <img src="${skin.image}" alt="${skin.name}">
                <div class="nft-name">${skin.name}</div>
                <button onclick="nftSystem.equipSkin('${skinId}')">${this.activeSkin === skinId ? 'Equipped' : 'Equip'}</button>
            `;
            inventoryGrid.appendChild(card);
        });
    }

    equipSkin(skinId) {
        if (!this.ownedSkins.has(skinId)) return;
        
        this.activeSkin = this.activeSkin === skinId ? null : skinId;
        this.updateInventory();
        
        // Update main fish appearance
        const mainFishImg = document.getElementById('mainFishImg');
        if (mainFishImg) {
            mainFishImg.src = this.activeSkin ? this.skins[this.activeSkin].image : 'assets/fish.png';
        }
    }
}

// Initialize NFT System
document.addEventListener('DOMContentLoaded', () => {
    window.nftSystem = new NFTSystem();
    
    // Set up tab switching to reinitialize shop when weekly shop tab is shown
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (e.target.dataset.tab === 'shop') {
                // Only initialize if the shop container is empty
                const shopContainer = document.querySelector('#weeklyShop');
                if (shopContainer && shopContainer.children.length === 0) {
                    window.nftSystem.initializeWeeklyShop();
                }
            }
        });
    });
});

// Make sure NFTSystem is available globally
if (!window.NFTSystem) {
    window.NFTSystem = NFTSystem;
}

// Export functions and constants
window.NFT_SYSTEM = {
    init: () => {
        if (!window.nftSystem) {
            window.nftSystem = new NFTSystem();
        }
        // Only initialize if the shop container is empty
        const shopContainer = document.querySelector('#weeklyShop');
        if (shopContainer && shopContainer.children.length === 0) {
            window.nftSystem.initializeWeeklyShop();
        }
    },
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
        const roll = Math.random();
        let rarity;
        let cumulativeChance = 0;
        
        // Check rarity based on cumulative probabilities
        for (const [rarityType, chance] of Object.entries(NFT_CONFIG.DROP_RATES)) {
            cumulativeChance += chance;
            if (roll < cumulativeChance) {
                rarity = rarityType;
                break;
            }
        }
        
        // Get a random skin, falling back to common if the chosen rarity has no available skins
        const skin = getRandomSkinFromRarity(rarity);
        if (skin) {
            await mintNFTDrop(skin);
            playerNFTState.lastDrop = now;
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
    const skins = Object.values(NFT_FISH_SKINS[rarity]).filter(skin => skin.available);
    if (skins.length === 0) {
        // If no skins are available in the chosen rarity, fall back to a common skin
        return getRandomSkinFromRarity('COMMON');
    }
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
    const connectButton = document.getElementById('abstractWalletConnect');
    
    connectButton.addEventListener('click', async () => {
        try {
            // Show loading state
            connectButton.classList.add('loading');
            connectButton.disabled = true;
            
            const connected = await window.ABSTRACT_INTEGRATION.connectWallet();
            
            if (connected) {
                localStorage.setItem('abstractWalletConnected', 'true');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            showError('Failed to connect wallet. Please try again.');
        } finally {
            // Remove loading state
            connectButton.classList.remove('loading');
            connectButton.disabled = false;
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