# Trust Me Bro ⭕️🔺🟥

A thrilling blockchain-based survival game inspired by Squid Game's glass tile challenge. Test your luck across 20 rounds of increasingly difficult tile selections where one wrong move means losing everything!

## 🎯 Game Overview

**Trust Me Bro** is a high-stakes betting game where players must survive 20 rounds of tile selection challenges. Each round presents a set of tiles with one deadly trap - choose wisely to multiply your bet and advance to the next round!

## 🎲 How It Works

### Game Mechanics

1. **Place Your Bet**: Start by wagering your desired amount
2. **Navigate 20 Rounds**: Each round presents 2-5 tiles to choose from
3. **Avoid the Death Tile**: One tile in each round is the "death tile" - step on it and you lose everything
4. **Multiply Your Winnings**: Successfully completing each round multiplies your money
5. **Cash Out or Continue**: After each successful round, decide whether to take your winnings or risk it for more

### Round Progression

- Each of the 20 rounds randomly generates between 2-5 tiles
- The number of tiles is completely random for each round
- Every round has exactly one death tile among the generated tiles

## 📊 Multiplier Formula

The payout multiplier for each round is calculated using the formula:

```
Multiplier = 1 / (1 - 1/n)
```

Where `n` = number of tiles in that round

### Example Calculations

| Tiles | Survival Chance | Multiplier | Calculation |
|-------|----------------|------------|-------------|
| 2 | 50% | **2.00x** | 1 / (1 - 1/2) = 2.00 |
| 3 | 66.67% | **1.50x** | 1 / (1 - 1/3) = 1.50 |
| 4 | 75% | **1.33x** | 1 / (1 - 1/4) = 1.33 |
| 5 | 80% | **1.25x** | 1 / (1 - 1/5) = 1.25 |

### Total Potential Winnings

Complete all 20 rounds successfully to achieve maximum multiplier potential!

**Example**: $100 bet completing all rounds with varying tile counts could yield substantial returns based on the cumulative multiplier effect.

## 🚀 Features

- 🎰 Provably fair randomization
- 💰 Real-time multiplier tracking
- 📈 Progressive difficulty system
- 🏆 Leaderboard system
- 💸 Instant payouts
- 🔒 Secure blockchain transactions

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity
- **Frontend**: React.js / Next.js
- **Blockchain**: Ethereum / Polygon
- **Web3 Integration**: ethers.js / wagmi

## 📝 Smart Contract Functions

```solidity
// Place initial bet and start game
function startGame(uint256 betAmount) external payable

// Select a tile in current round
function selectTile(uint8 tileIndex) external

// Cash out current winnings
function cashOut() external

// Get current game state
function getGameState() external view returns (GameState)
```

## 🎮 Game States

- **IDLE**: No active game
- **IN_PROGRESS**: Game currently running
- **WON**: Successfully completed all rounds
- **LOST**: Hit a death tile
- **CASHED_OUT**: Player withdrew winnings early

## ⚠️ Risk Warning

This is a game of chance. The odds decrease as you progress through rounds. Only bet what you can afford to lose. The house edge ensures long-term profitability for the protocol.

### Survival Probability

- Surviving 1 round with 2 tiles: 50%
- Surviving 10 rounds (avg 3 tiles): ~1.73%
- Surviving all 20 rounds: **Extremely low probability**

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📞 Contact

Created by [@abhishek-01k](https://github.com/abhishek-01k)

---

**Disclaimer**: This game involves real money wagering. Please gamble responsibly and only with funds you can afford to lose. Must be 18+ to play.

🎲 *Trust me bro, you'll make it to round 20... probably not.* 🎲
