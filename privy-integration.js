// Privy Integration
const PRIVY_CONFIG = {
    appId: "your-privy-app-id", // Replace with your Privy app ID
};

class PrivyWalletManager {
    constructor() {
        this.isConnected = false;
        this.loadPrivySDK();
    }

    async loadPrivySDK() {
        try {
            const script = document.createElement('script');
            script.src = 'https://cdn.privy.io/sdk.min.js';
            script.async = true;
            script.onload = () => this.initializePrivy();
            document.head.appendChild(script);
        } catch (error) {
            console.error('Failed to load Privy SDK:', error);
        }
    }

    initializePrivy() {
        if (!window.privy) {
            console.error('Privy SDK not found');
            return;
        }

        window.privy.init({
            ...PRIVY_CONFIG,
            onSuccess: (user) => {
                console.log('Privy initialized successfully', user);
                this.isConnected = true;
                this.updateUI(true);
            },
            onError: (error) => {
                console.error('Privy initialization error:', error);
                this.updateUI(false);
            }
        });
    }

    async toggleWallet() {
        const button = document.getElementById('abstractWalletConnect');
        
        if (this.isConnected) {
            await this.disconnect();
        } else {
            await this.connectWallet();
        }
    }

    async connectWallet() {
        try {
            const button = document.getElementById('abstractWalletConnect');
            button.classList.add('loading');

            const result = await window.privy.connectWallet({
                provider: 'abstract',
                chainId: 1, // Ethereum mainnet
            });

            if (result.success) {
                this.isConnected = true;
                this.updateUI(true, result.address);
                // Initialize Abstract integration after successful connection
                if (window.ABSTRACT_INTEGRATION) {
                    await window.ABSTRACT_INTEGRATION.initializeWithPrivy(result);
                }
            } else {
                throw new Error('Failed to connect wallet');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.updateUI(false);
        }
    }

    async disconnect() {
        try {
            await window.privy.disconnect();
            this.isConnected = false;
            this.updateUI(false);
            
            // Clean up Abstract integration
            if (window.ABSTRACT_INTEGRATION) {
                await window.ABSTRACT_INTEGRATION.cleanup();
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    }

    updateUI(connected, address) {
        const button = document.getElementById('abstractWalletConnect');
        const textSpan = button.querySelector('.wallet-btn-text');
        const loadingSpan = button.querySelector('.wallet-btn-loading');

        button.classList.remove('loading');
        loadingSpan.style.display = 'none';

        if (connected && address) {
            button.classList.add('connected');
            textSpan.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
            button.title = 'Click to disconnect';
        } else {
            button.classList.remove('connected');
            textSpan.textContent = 'Connect Abstract Wallet';
            button.disabled = false;
            button.title = 'Click to connect';
        }
    }
}

// Initialize Privy Wallet Manager
window.privyWalletManager = new PrivyWalletManager();

// Update click handler to use toggle
document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('abstractWalletConnect');
    if (connectButton) {
        connectButton.addEventListener('click', () => {
            if (window.privyWalletManager) {
                window.privyWalletManager.toggleWallet();
            }
        });
    }
}); 