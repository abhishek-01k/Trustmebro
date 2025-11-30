// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MultiplierGame} from "../src/MultiplierGame.sol";

/**
 * @title MultiplierGameScript
 * @notice Deployment script for the MultiplierGame contract
 * @dev Usage:
 *   forge script script/MultiplierGame.s.sol:MultiplierGameScript \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Environment variables:
 *   - PRIVATE_KEY: Deployer private key
 *   - INITIAL_POT: Initial pot funding in wei (optional, defaults to 0)
 *   - BACKEND_ADDRESS: Backend address to authorize (optional)
 */
contract MultiplierGameScript is Script {
    MultiplierGame public game;

    function setUp() public {}

    function run() public {
        // Read environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 initialPot = vm.envOr("INITIAL_POT", uint256(0));
        address backendAddress = vm.envOr("BACKEND_ADDRESS", address(0));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        game = new MultiplierGame();
        console.log("MultiplierGame deployed at:", address(game));

        // Fund initial pot if specified
        if (initialPot > 0) {
            game.refillPot{value: initialPot}();
            console.log("Initial pot funded:", initialPot);
        }

        // Authorize backend if specified
        if (backendAddress != address(0)) {
            game.setBackend(backendAddress, true);
            console.log("Backend authorized:", backendAddress);
        }

        vm.stopBroadcast();

        // Log deployment summary
        console.log("=== Deployment Summary ===");
        console.log("Contract:", address(game));
        console.log("Owner:", game.owner());
        console.log("Pot Balance:", game.getPotBalance());
        console.log("Max Bet:", game.getMaxBet());
        console.log("Max Payout:", game.getMaxPayout());
    }
}

/**
 * @title MultiplierGameFundScript
 * @notice Script to add funds to an existing MultiplierGame contract
 * @dev Usage:
 *   forge script script/MultiplierGame.s.sol:MultiplierGameFundScript \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     -vvvv
 *
 * Environment variables:
 *   - PRIVATE_KEY: Owner private key
 *   - GAME_ADDRESS: Deployed MultiplierGame address
 *   - FUND_AMOUNT: Amount to fund in wei
 */
contract MultiplierGameFundScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address gameAddress = vm.envAddress("GAME_ADDRESS");
        uint256 fundAmount = vm.envUint("FUND_AMOUNT");

        MultiplierGame game = MultiplierGame(payable(gameAddress));

        vm.startBroadcast(deployerPrivateKey);

        game.refillPot{value: fundAmount}();

        vm.stopBroadcast();

        console.log("Pot refilled with:", fundAmount);
        console.log("New pot balance:", game.getPotBalance());
    }
}

/**
 * @title MultiplierGameSetBackendScript
 * @notice Script to authorize/deauthorize a backend address
 * @dev Usage:
 *   forge script script/MultiplierGame.s.sol:MultiplierGameSetBackendScript \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     -vvvv
 *
 * Environment variables:
 *   - PRIVATE_KEY: Owner private key
 *   - GAME_ADDRESS: Deployed MultiplierGame address
 *   - BACKEND_ADDRESS: Backend address to set
 *   - AUTHORIZED: "true" or "false"
 */
contract MultiplierGameSetBackendScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address gameAddress = vm.envAddress("GAME_ADDRESS");
        address backendAddress = vm.envAddress("BACKEND_ADDRESS");
        bool authorized = vm.envBool("AUTHORIZED");

        MultiplierGame game = MultiplierGame(payable(gameAddress));

        vm.startBroadcast(deployerPrivateKey);

        game.setBackend(backendAddress, authorized);

        vm.stopBroadcast();

        console.log("Backend", backendAddress, "authorized:", authorized);
    }
}

