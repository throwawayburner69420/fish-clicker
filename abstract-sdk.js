// Mock Abstract SDK for demonstration
window.AbstractWallet = {
    connect: async function(config) {
        console.log('Mock Abstract wallet connecting...');
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockWallet = {
            getAddress: async () => '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            getContract: async (address, name) => ({
                methods: {
                    mint: () => ({
                        send: async () => ({ events: { Transfer: { returnValues: { tokenId: Date.now() } } } })
                    }),
                    approve: () => ({
                        send: async () => ({ status: true })
                    }),
                    listItem: () => ({
                        send: async () => ({ status: true })
                    }),
                    purchaseItem: () => ({
                        send: async () => ({ status: true })
                    })
                }
            }),
            uploadMetadata: async (metadata) => ({
                uri: `ipfs://mock/${Date.now()}`
            })
        };

        if (config.onConnect) {
            config.onConnect();
        }

        return mockWallet;
    }
}; 