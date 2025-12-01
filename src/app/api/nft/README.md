# NFT Metadata API

This endpoint provides ERC721-compliant metadata for the Trust Me Bro NFT collection, making it compatible with OpenSea and other NFT marketplaces.

## Endpoint

```
GET /api/nft/[tokenId]
```

## Parameters

- `tokenId`: The position-based token ID (0, 1, 2, ...)

## Response Format

Returns JSON metadata following the OpenSea metadata standard:

```json
{
  "name": "Trust Me Bro #1",
  "description": "Official Trust Me Bro waitlist pass - a soulbound NFT proving you were early...",
  "image": "https://trustmebro-tan.vercel.app/api/og/waitlist?pos=0",
  "external_url": "https://trustmebro-tan.vercel.app",
  "attributes": [
    {
      "trait_type": "Position",
      "value": 0,
      "display_type": "number"
    },
    {
      "trait_type": "Waitlist Number",
      "value": 1,
      "display_type": "number"
    },
    {
      "trait_type": "Type",
      "value": "Waitlist Pass"
    },
    {
      "trait_type": "Transferable",
      "value": "Soulbound"
    },
    {
      "trait_type": "Access Level",
      "value": "Early Access"
    }
  ]
}
```

## Contract Integration

The NFT smart contract's `tokenURI()` function returns:
- Token ID 1 → `/api/nft/0` (Position 0)
- Token ID 2 → `/api/nft/1` (Position 1)
- Token ID 3 → `/api/nft/2` (Position 2)

## Example Usage

```bash
# Get metadata for position 0 (Token ID 1)
curl https://trustmebro-tan.vercel.app/api/nft/0

# Get metadata for position 5 (Token ID 6)
curl https://trustmebro-tan.vercel.app/api/nft/5
```

## OpenSea Integration

Once the contract is deployed and NFTs are minted:

1. **Automatic Discovery**: OpenSea will automatically detect the NFTs
2. **Metadata Refresh**: Click "Refresh metadata" on OpenSea if the image doesn't load immediately
3. **Image Display**: The dynamic OG image will be displayed
4. **Attributes**: All traits will be visible in the "Properties" section

## Image Generation

The `image` field points to the dynamic OG image API:
```
https://trustmebro-tan.vercel.app/api/og/waitlist?pos={position}
```

This generates a unique image for each NFT showing:
- Position number
- Total degens count
- Squid Game themed design
- Neon effects and styling

## Caching

- Cache-Control header: `public, s-maxage=3600, stale-while-revalidate=86400`
- Metadata is cached for 1 hour
- Stale content served while revalidating for 24 hours
- CORS enabled for cross-origin requests

