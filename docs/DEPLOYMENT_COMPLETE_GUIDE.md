# Complete NFT Deployment & Integration Guide

## 🎯 Overview

This guide covers the complete process from deploying the NFT contract to having users mint their game pass NFTs.

---

## Part 1: Deployment Preparation

### Cost Breakdown

| Item | Gas Units | Gas Price | ETH Cost | USD Cost* |
|------|-----------|-----------|----------|-----------|
| Deploy Contract | ~2,500,000 | 0.001-0.01 gwei | 0.0025-0.025 | $8-80 |
| **Typical Deploy** | **2,500,000** | **0.002 gwei** | **~0.005** | **~$15-20** |
| User Mint NFT | ~50,000 | 0.001-0.01 gwei | 0.00005-0.0005 | $0.15-$2 |
| **Typical Mint** | **50,000** | **0.002 gwei** | **~0.0001** | **~$0.30-0.50** |

*USD estimates at $3,000/ETH

### Get Base ETH

**Option 1: Bridge from Ethereum (Recommended)**
```
1. Go to: https://bridge.base.org/
2. Connect wallet
3. Bridge 0.05-0.1 ETH
4. Wait ~10 minutes
```

**Option 2: Buy on Exchange**
```
1. Use Coinbase or other exchange
2. Buy ETH
3. Withdraw to Base network
4. Address: Your wallet address
```

**Option 3: Testnet (For Testing)**
```
Base Sepolia Faucet:
https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

---

## Part 2: Deployment

### Step-by-Step Deployment

#### 1. Prepare Environment

Create `.env.local` in project root:

```bash
# Deployment Config
PRIVATE_KEY=0x1234567890abcdef...  # Your wallet private key
RPC_URL=https://mainnet.base.org     # Base mainnet RPC
NETWORK=base                         # Network identifier

# Optional: Contract verification
BASESCAN_API_KEY=ABC123...          # Get from basescan.org

# Optional: Custom metadata URI
BASE_URI=https://trustmebro-tan.vercel.app/api/nft/
```

#### 2. Build Contract

```bash
npm run contracts:build:nft
```

**Expected Output:**
```
Compiling 48 files with Solc 0.8.28
Solc 0.8.28 finished in 1.47s
Compiler run successful!
```

#### 3. Check Balance

```bash
# Replace with your wallet address
cast balance 0xYourAddress --rpc-url https://mainnet.base.org
```

**Should show:** `> 50000000000000000` (0.05 ETH)

#### 4. Deploy

```bash
npm run scripts:deploy-nft
```

**Expected Output:**
```
🚀 Deploying TrustMeBroNFT contract to Base...

✓ Base URI: https://trustmebro-tan.vercel.app/api/nft/
✓ Connected to Base at https://mainnet.base.org
✓ Current block: 12345678
✓ Using deployer account: 0xYourAddress

📦 Deploying NFT contract...
✓ Deployment transaction: 0xTxHashHere...
⏳ Waiting for confirmation...

✅ NFT contract deployed at: 0xNewContractAddress...

=== Deployment Summary ===
Contract Address: 0xNewContractAddress...
Name: Trust Me Bro
Symbol: TMB
Owner: 0xYourAddress
Total Supply: 0
Minting: FREE
Chain ID: 8453
Network: Base
Explorer: https://basescan.org
Contract on Explorer: https://basescan.org/address/0xNewContractAddress...

✅ Deployment complete!
```

#### 5. Save Contract Address

```bash
# Copy from deployment output
echo "NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xNewContractAddress..." >> .env.local
```

---

## Part 3: Contract Verification (Optional but Recommended)

### Why Verify?

- ✅ Users can read contract source on BaseScan
- ✅ Builds trust and transparency
- ✅ Enables better debugging
- ✅ Required for some NFT marketplaces

### Method 1: Manual (BaseScan)

```
1. Go to: https://basescan.org/verifyContract
2. Enter contract address
3. Select compiler version: 0.8.28
4. Upload contract source
5. Enter constructor arguments
6. Submit
```

### Method 2: Foundry (Automated)

```bash
cd contracts

forge verify-contract \
  0xYourContractAddress \
  src/TrustMeBroNFT.sol:TrustMeBroNFT \
  --chain base \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string)" "https://trustmebro-tan.vercel.app/api/nft/")
```

---

## Part 4: Testing

### Test Contract Functions

```bash
# Set contract address variable
export NFT_ADDRESS=0xYourContractAddress
export RPC=https://mainnet.base.org

# 1. Check name
cast call $NFT_ADDRESS "name()(string)" --rpc-url $RPC
# Expected: "Trust Me Bro"

# 2. Check symbol
cast call $NFT_ADDRESS "symbol()(string)" --rpc-url $RPC
# Expected: "TMB"

# 3. Check total supply
cast call $NFT_ADDRESS "totalSupply()(uint256)" --rpc-url $RPC
# Expected: 0

# 4. Check if paused
cast call $NFT_ADDRESS "paused()(bool)" --rpc-url $RPC
# Expected: false

# 5. Check owner
cast call $NFT_ADDRESS "owner()(address)" --rpc-url $RPC
# Expected: Your wallet address
```

### Test Minting

```bash
# Mint NFT (costs gas)
cast send $NFT_ADDRESS "mint()" \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC

# Check if you have NFT
cast call $NFT_ADDRESS "hasNft(address)(bool)" YOUR_ADDRESS \
  --rpc-url $RPC
# Expected: true

# Check your balance
cast call $NFT_ADDRESS "balanceOf(address)(uint256)" YOUR_ADDRESS \
  --rpc-url $RPC
# Expected: 1

# Check token URI
cast call $NFT_ADDRESS "tokenURI(uint256)(string)" 1 \
  --rpc-url $RPC
# Expected: https://trustmebro-tan.vercel.app/api/nft/0
```

---

## Part 5: Frontend Integration

### Update Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xYourContractAddress
```

### Restart Development Server

```bash
npm run dev
```

### Test Frontend Flow

1. **Navigate to App**
   ```
   http://localhost:3000
   ```

2. **Connect Wallet**
   - Click connect button
   - Approve Privy/Farcaster connection
   - Ensure wallet has Base ETH

3. **Join Waitlist**
   - Click "Join & Mint NFT"
   - Approve transaction in wallet
   - Wait for "Minting NFT..." state
   - See success message

4. **Verify in Database**
   ```bash
   npx prisma studio
   ```
   - Navigate to Waitlist table
   - Find your entry
   - Check `nftMinted = true`
   - Check `nftTokenId` is set

---

## Part 6: OpenSea Integration

### Automatic Discovery

OpenSea automatically detects Base NFTs. Your NFTs will appear at:

```
https://opensea.io/assets/base/0xYourContractAddress/1
```

### Manual Refresh

If metadata doesn't load immediately:

1. Go to NFT page on OpenSea
2. Click "..." menu (top right)
3. Click "Refresh metadata"
4. Wait 30-60 seconds

### Check Collection

Your collection page:
```
https://opensea.io/assets/base/0xYourContractAddress
```

---

## Part 7: Production Deployment

### Deploy Frontend to Vercel

#### 1. Add Environment Variables in Vercel

```
Dashboard → Project → Settings → Environment Variables

Add:
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xYourContractAddress
DATABASE_URL=postgresql://...
NEXT_PUBLIC_BASE_URL=https://trustmebro-tan.vercel.app
... (other env vars)
```

#### 2. Deploy

```bash
git add .
git commit -m "Add NFT contract integration"
git push origin main
```

#### 3. Apply Database Migration

```bash
# From Vercel CLI or your terminal
DATABASE_URL="your_production_db_url" npx prisma db push
```

### Monitor First Mints

Watch your contract:
```bash
# Check total supply periodically
watch -n 5 'cast call $NFT_ADDRESS "totalSupply()(uint256)" --rpc-url $RPC'

# Check specific user
cast call $NFT_ADDRESS "hasNft(address)(bool)" USER_ADDRESS --rpc-url $RPC
```

---

## Part 8: Monitoring & Analytics

### Contract Metrics

```sql
-- Database query for NFT stats
SELECT 
  COUNT(*) as total_waitlist,
  COUNT(CASE WHEN "nftMinted" = true THEN 1 END) as total_minted,
  COUNT(CASE WHEN "nftMinted" = false THEN 1 END) as pending_mint,
  ROUND(COUNT(CASE WHEN "nftMinted" = true THEN 1 END) * 100.0 / COUNT(*), 2) as mint_rate
FROM "Waitlist";
```

### On-Chain Metrics

```bash
# Total NFTs minted
cast call $NFT_ADDRESS "totalSupply()(uint256)" --rpc-url $RPC

# Check specific token owner
cast call $NFT_ADDRESS "ownerOf(uint256)(address)" 1 --rpc-url $RPC

# Next token ID
cast call $NFT_ADDRESS "nextTokenId()(uint256)" --rpc-url $RPC
```

### BaseScan Dashboard

Monitor your contract:
```
https://basescan.org/address/0xYourContractAddress
```

Track:
- ✅ Total transactions
- ✅ Mint events
- ✅ Gas usage
- ✅ Recent activity

---

## Part 9: Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Button disabled | No wallet/Farcaster | Connect wallet and Farcaster |
| "Contract not configured" | Missing env var | Set `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` |
| "Insufficient funds" | No Base ETH | Bridge ETH to Base |
| "Transaction failed" | Contract paused/error | Check contract state |
| "Already have NFT" | Duplicate mint | Working as intended |
| Metadata not loading | API down/wrong URL | Check API endpoint |

### Debug Commands

```bash
# Check env var is set
echo $NEXT_PUBLIC_NFT_CONTRACT_ADDRESS

# Check contract is deployed
cast code $NFT_ADDRESS --rpc-url $RPC

# Check wallet balance
cast balance YOUR_ADDRESS --rpc-url $RPC

# Check transaction status
cast tx 0xTxHash --rpc-url $RPC

# Check transaction receipt
cast receipt 0xTxHash --rpc-url $RPC
```

---

## Part 10: Success Checklist

### Deployment Complete ✅

- [x] Contract deployed to Base mainnet
- [x] Contract verified on BaseScan
- [x] Address saved to environment variables
- [x] Contract functions tested
- [x] Frontend updated and restarted
- [x] Test mint completed successfully
- [x] Database tracking NFT mints
- [x] OpenSea displaying NFTs
- [x] Production deployment updated
- [x] Monitoring in place

### User Experience ✅

- [x] Clear "Join & Mint NFT" button
- [x] Gas fee disclosure visible
- [x] Loading states work
- [x] Error messages helpful
- [x] Success state shows position
- [x] Share functionality works
- [x] Duplicate prevention works

### Next Steps 🚀

1. **Announce to Users**
   - Share contract address
   - Explain free minting
   - Promote on social media

2. **Monitor First 24 Hours**
   - Watch for errors
   - Check gas costs
   - Verify metadata loading

3. **Gather Feedback**
   - User experience
   - Transaction speeds
   - Any issues

4. **Optimize**
   - Adjust metadata if needed
   - Update base URI if required
   - Fix any edge cases

---

## 📚 Quick Reference

### Base Mainnet
- **Chain ID**: 8453
- **RPC**: https://mainnet.base.org
- **Explorer**: https://basescan.org
- **Bridge**: https://bridge.base.org

### Your Deployment
- **Contract**: `0xYourContractAddress`
- **Owner**: `0xYourWalletAddress`
- **Cost**: ~$15-30 deployment + $0.30-0.80 per user mint

### Support Resources
- [Base Docs](https://docs.base.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenSea Docs](https://docs.opensea.io/)
- [Viem Docs](https://viem.sh/)

---

## 🎉 Congratulations!

Your NFT contract is live on Base mainnet. Users can now mint their game pass NFTs and join the waitlist with proof of participation on-chain!

**Remember**: Base is cheap, fast, and user-friendly. Your users will have a great minting experience with minimal costs. 🚀

