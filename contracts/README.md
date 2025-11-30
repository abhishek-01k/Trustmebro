## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Project Structure

```
contracts/
├── src/          # Smart contract source files
├── test/         # Test files
├── script/       # Deployment scripts
├── lib/          # Dependencies (forge-std)
└── foundry.toml  # Foundry configuration
```

## Usage

### Using npm/pnpm scripts (recommended)

From the project root:

```shell
# Build contracts
pnpm contracts:build

# Run tests
pnpm contracts:test

# Run tests with gas report
pnpm contracts:test:gas

# Run tests with coverage
pnpm contracts:test:coverage

# Run tests in watch mode
pnpm contracts:test:watch

# Format code
pnpm contracts:format

# Install dependencies
pnpm contracts:install

# Start local Anvil node
pnpm contracts:anvil

# Run deployment script
pnpm contracts:script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Direct Foundry commands

From the `contracts/` directory:

#### Build

```shell
$ forge build
```

#### Test

```shell
$ forge test
$ forge test --gas-report  # With gas reporting
$ forge test --coverage    # With coverage
$ forge test --watch       # Watch mode
```

#### Format

```shell
$ forge fmt
```

#### Gas Snapshots

```shell
$ forge snapshot
```

#### Anvil (Local Node)

```shell
$ anvil
```

#### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

#### Cast

```shell
$ cast <subcommand>
```

#### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

## Configuration

The project is configured via `foundry.toml`:

- **Solidity Version**: 0.8.28
- **Optimizer**: Enabled with 200 runs
- **Fuzz Testing**: 256 runs by default
- **Remappings**: `@forge-std/` for forge-std library

## Dependencies

- **forge-std**: Foundry standard library (automatically installed)

To add more dependencies:

```shell
forge install <github-user>/<repo>
```
