// Abstract Blockchain Integration
const ABSTRACT_CONFIG = {
    NFT_CONTRACT_ADDRESS: "0x...", // Replace with actual NFT contract address
    MARKETPLACE_ADDRESS: "0x...", // Replace with actual marketplace contract address
    NETWORK_ID: 1, // Replace with actual Abstract network ID
};

// Check if Abstract SDK is loaded
if (!window.AbstractWallet) {
    console.error('Abstract SDK not found! Make sure the SDK is properly loaded.');
}

// Wallet Connection
let abstractWallet = null;
let userAddress = null;

async function connectAbstractWallet() {
    try {
        console.log('Attempting to connect Abstract wallet...');
        
        // Check if SDK is loaded
        if (!window.AbstractWallet) {
            throw new Error('Abstract SDK not initialized. Please check your internet connection and try again.');
        }

        // Initialize Abstract Global Wallet with configuration
        const wallet = await window.AbstractWallet.connect({
            network: ABSTRACT_CONFIG.NETWORK_ID,
            onConnect: () => {
                console.log('Wallet connected successfully!');
                updateWalletUI();
            },
            onDisconnect: () => {
                console.log('Wallet disconnected');
                abstractWallet = null;
                userAddress = null;
                updateWalletUI();
            },
            onError: (error) => {
                console.error('Wallet connection error:', error);
            }
        });

        abstractWallet = wallet;
        userAddress = await wallet.getAddress();
        
        console.log('Wallet connected:', userAddress);
        
        // Update UI to show connected state
        updateWalletUI();
        
        // Initialize NFT contracts
        await initializeNFTContracts();
        
        return true;
    } catch (error) {
        console.error('Failed to connect Abstract wallet:', error);
        showError('Failed to connect wallet: ' + error.message);
        return false;
    }
}

// Show error message to user
function showError(message) {
    const popup = document.createElement('div');
    popup.className = 'nft-drop-popup';
    popup.innerHTML = `
        <div class="nft-drop-content">
            <h2>Error</h2>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(popup);
}

// NFT Contract Integration
let nftContract = null;
let marketplaceContract = null;

async function initializeNFTContracts() {
    try {
        // Initialize NFT contract
        nftContract = await abstractWallet.getContract(
            ABSTRACT_CONFIG.NFT_CONTRACT_ADDRESS,
            'FishClickerNFT'
        );
        
        // Initialize marketplace contract
        marketplaceContract = await abstractWallet.getContract(
            ABSTRACT_CONFIG.MARKETPLACE_ADDRESS,
            'FishClickerMarket'
        );
    } catch (error) {
        console.error('Failed to initialize NFT contracts:', error);
    }
}

// NFT Metadata Handling
const NFT_METADATA_SCHEMA = {
    name: String,
    description: String,
    image: String,
    attributes: {
        rarity: String,
        boostMultiplier: Number,
        mintDate: String,
        skinType: String
    }
};

async function mintNFTSkin(skinData) {
    try {
        if (!nftContract || !userAddress) {
            throw new Error('Wallet not connected or contracts not initialized');
        }

        // Prepare metadata according to Abstract standards
        const metadata = {
            name: skinData.name,
            description: skinData.description,
            image: skinData.image,
            attributes: {
                rarity: skinData.rarity,
                boostMultiplier: skinData.boostMultiplier,
                mintDate: new Date().toISOString(),
                skinType: skinData.id
            }
        };

        // Upload metadata to Abstract's IPFS
        const metadataURI = await uploadToAbstractIPFS(metadata);

        // Mint NFT
        const tx = await nftContract.methods.mint(userAddress, metadataURI).send({
            from: userAddress
        });

        return tx;
    } catch (error) {
        console.error('Failed to mint NFT:', error);
        throw error;
    }
}

async function uploadToAbstractIPFS(metadata) {
    try {
        const response = await abstractWallet.uploadMetadata(metadata);
        return response.uri;
    } catch (error) {
        console.error('Failed to upload to IPFS:', error);
        throw error;
    }
}

// NFT Trading Functions
async function listNFTForSale(tokenId, price) {
    try {
        if (!marketplaceContract || !userAddress) {
            throw new Error('Wallet not connected or contracts not initialized');
        }

        // Approve marketplace contract
        await nftContract.methods.approve(ABSTRACT_CONFIG.MARKETPLACE_ADDRESS, tokenId).send({
            from: userAddress
        });

        // List NFT
        const tx = await marketplaceContract.methods.listItem(
            ABSTRACT_CONFIG.NFT_CONTRACT_ADDRESS,
            tokenId,
            price
        ).send({
            from: userAddress
        });

        return tx;
    } catch (error) {
        console.error('Failed to list NFT:', error);
        throw error;
    }
}

async function purchaseNFT(tokenId, price) {
    try {
        if (!marketplaceContract || !userAddress) {
            throw new Error('Wallet not connected or contracts not initialized');
        }

        const tx = await marketplaceContract.methods.purchaseItem(
            ABSTRACT_CONFIG.NFT_CONTRACT_ADDRESS,
            tokenId
        ).send({
            from: userAddress,
            value: price
        });

        return tx;
    } catch (error) {
        console.error('Failed to purchase NFT:', error);
        throw error;
    }
}

// UI Updates
function updateWalletUI() {
    const connectButton = document.getElementById('abstractWalletConnect');
    if (connectButton) {
        connectButton.textContent = userAddress ? 
            `Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 
            'Connect Abstract Wallet';
        connectButton.disabled = !!userAddress;
    }
}

// Export functions
window.ABSTRACT_INTEGRATION = {
    connectWallet: connectAbstractWallet,
    mintNFT: mintNFTSkin,
    listNFT: listNFTForSale,
    purchaseNFT: purchaseNFT,
    isConnected: () => !!userAddress,
    getUserAddress: () => userAddress
};

// Initialize Abstract integration when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Abstract integration...');
    if (localStorage.getItem('abstractWalletConnected') === 'true') {
        console.log('Attempting to reconnect previous wallet session...');
        connectAbstractWallet();
    }
}); 