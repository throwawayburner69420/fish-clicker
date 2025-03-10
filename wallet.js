// Privy configuration
const PRIVY_APP_ID = 'cm821xzgy00ivfqyvcrq5n87u';

// Initialize Privy
class WalletManager {
    constructor() {
        this.isInitialized = false;
        this.user = null;
        this.privy = null;
    }

    async waitForPrivy() {
        return new Promise((resolve, reject) => {
            if (window.privy) {
                resolve(window.privy);
                return;
            }

            let attempts = 0;
            const maxAttempts = 50;
            const interval = setInterval(() => {
                console.log('Checking for Privy SDK...', attempts);
                if (window.privy) {
                    clearInterval(interval);
                    resolve(window.privy);
                    return;
                }

                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('Privy SDK failed to load after 5 seconds'));
                }
            }, 100);
        });
    }

    async init() {
        try {
            console.log('Waiting for Privy SDK...');
            this.privy = await this.waitForPrivy();
            console.log('Privy SDK loaded, initializing...');

            // Initialize Privy
            await this.privy.initialize({
                appId: PRIVY_APP_ID,
                ...window.privyConfig
            });

            // Set up button click handler
            const connectButton = document.getElementById('walletConnect');
            if (connectButton) {
                connectButton.addEventListener('click', () => this.handleConnect());
                console.log('Click handler added to connect button');
            }

            // Set up auth change listener
            this.privy.on('auth:success', (user) => {
                console.log('Auth success:', user);
                this.handleLoginSuccess(user);
            });

            this.privy.on('auth:error', (error) => {
                console.error('Auth error:', error);
            });

            this.privy.on('auth:logout', () => {
                console.log('User logged out');
                this.handleLogout();
            });

            // Check initial auth state
            const user = await this.privy.getUser();
            if (user) {
                console.log('User already authenticated:', user);
                this.handleLoginSuccess(user);
            }

            this.isInitialized = true;
            console.log('Wallet manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize wallet manager:', error);
        }
    }

    async handleConnect() {
        try {
            console.log('Connect button clicked');
            if (!this.privy) {
                console.error('Privy not initialized');
                return;
            }

            if (await this.privy.isAuthenticated()) {
                console.log('User authenticated, logging out...');
                await this.privy.logout();
            } else {
                console.log('Opening login modal...');
                await this.privy.authenticate();
            }
        } catch (error) {
            console.error('Error handling connect:', error);
        }
    }

    handleLoginSuccess(user) {
        console.log('Login successful:', user);
        this.user = user;
        this.updateButtonUI(true);
    }

    handleLogout() {
        console.log('Logout successful');
        this.user = null;
        this.updateButtonUI(false);
    }

    updateButtonUI(isConnected) {
        const button = document.getElementById('walletConnect');
        if (!button) return;

        const textSpan = button.querySelector('.wallet-text');
        const loadingSpan = button.querySelector('.wallet-loading');

        if (!textSpan || !loadingSpan) return;

        loadingSpan.style.display = 'none';
        button.classList.remove('loading');

        if (isConnected && this.user?.wallet?.address) {
            button.classList.add('connected');
            const address = this.user.wallet.address;
            textSpan.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
            button.title = 'Click to disconnect';
        } else {
            button.classList.remove('connected');
            textSpan.textContent = 'Connect Wallet';
            button.title = 'Click to connect';
        }
    }
}

// Create wallet manager instance
window.walletManager = new WalletManager();
console.log('Wallet manager created'); 