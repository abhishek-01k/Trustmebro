# Deployment Guide

## Local Development (Anvil)

For local testing, use the default Anvil configuration:

```bash
# Start Anvil
pnpm contracts:anvil

# Deploy token
pnpm scripts:deploy-token

# Deploy contract
export TOKEN_ADDRESS=<token-address-from-deploy-token>
pnpm scripts:deploy
```

## Base Sepolia Testnet

### Prerequisites

1. **Get Base Sepolia ETH**: You need Base Sepolia ETH for gas fees
   - Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - Or use [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)

2. **Get an RPC URL**: 
   - Use a public RPC: `https://sepolia.base.org`
   - Or get a free RPC from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)

3. **Set Environment Variables**:
   ```bash
   export PRIVATE_KEY=0x...  # Your deployer wallet private key
   export RPC_URL=https://sepolia.base.org  # Base Sepolia RPC URL
   export NETWORK=base-sepolia
   export TOKEN_ADDRESS=0x...  # Your ERC20 token address on Base Sepolia
   ```

### Deployment Steps

1. **Deploy ERC20 Token** (if needed):
   ```bash
   PRIVATE_KEY=0x... \
   RPC_URL=https://sepolia.base.org \
   NETWORK=base-sepolia \
   pnpm scripts:deploy-token
   ```

2. **Deploy MultiplierGame Contract**:
   ```bash
   PRIVATE_KEY=0x... \
   RPC_URL=https://sepolia.base.org \
   NETWORK=base-sepolia \
   TOKEN_ADDRESS=0x... \
   pnpm scripts:deploy
   ```

### Example Full Deployment

```bash
# Set environment variables
export PRIVATE_KEY=0xYourPrivateKeyHere
export RPC_URL=https://sepolia.base.org
export NETWORK=base-sepolia

# Deploy token
pnpm scripts:deploy-token

# Get token address from output, then deploy contract
export TOKEN_ADDRESS=0xTokenAddressFromPreviousStep
pnpm scripts:deploy
```

### Environment Variables

- `PRIVATE_KEY` (required): Your deployer wallet private key
- `RPC_URL` (required for non-Anvil): RPC endpoint URL
- `NETWORK` (optional): Network name (`anvil` or `base-sepolia`, defaults to `anvil`)
- `TOKEN_ADDRESS` (required for contract deployment): ERC20 token address

### Security Notes

⚠️ **Never commit your private key to version control!**

- Use environment variables or a `.env` file (add to `.gitignore`)
- Consider using a dedicated deployer wallet with limited funds
- For production, use a hardware wallet or secure key management service

### Verifying Deployment

After deployment, you can verify your contract on Base Sepolia explorer:
- [Base Sepolia Explorer](https://sepolia.basescan.org/)

The deployment script will output the contract address and explorer link.

