// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ProofOfInferenceAVS.sol";
import "../src/MockToken.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy mock token
        MockToken rewardToken = new MockToken("Proof of Inference Token", "POI");
        console.log("Deployed MockToken at:", address(rewardToken));

        // For now, use the same address for eigenLayerRegistry and erc8004Registry
        address eigenLayerRegistry = 0x1234567890123456789012345678901234567890;
        address erc8004Registry = 0x2345678901234567890123456789012345678901;

        // Deploy ProofOfInferenceAVS
        ProofOfInferenceAVS avs = new ProofOfInferenceAVS(
            address(rewardToken),
            eigenLayerRegistry,
            erc8004Registry
        );
        console.log("Deployed ProofOfInferenceAVS at:", address(avs));

        vm.stopBroadcast();
    }
}