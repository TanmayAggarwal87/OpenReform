/**
 * OpenReform Contract Deployment Script (Ethers.js version)
 * Deploys all contracts to Sepolia testnet
 * 
 * Usage:
 * 1. Set DEPLOYER_PRIVATE_KEY in .env
 * 2. Run: npx hardhat run scripts/deploy.ts --network sepolia
 */

import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("🚀 Deploying OpenReform contracts to Sepolia...\n");

    // Get deployer account using ethers
    const [deployer] = await hre.ethers.getSigners();

    console.log(`Deployer: ${deployer.address}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

    if (balance === 0n) {
        throw new Error("Deployer has no ETH! Get testnet ETH from https://sepoliafaucet.com/");
    }

    // 1. Deploy ImplementerRegistry
    console.log("1️⃣ Deploying ImplementerRegistry...");
    const ImplementerRegistry = await hre.ethers.getContractFactory("ImplementerRegistry");
    const implementerRegistry = await ImplementerRegistry.deploy();
    await implementerRegistry.waitForDeployment();
    const implementerRegistryAddress = await implementerRegistry.getAddress();
    console.log(`   ✅ ImplementerRegistry: ${implementerRegistryAddress}\n`);

    // 2. Deploy PetitionRegistry
    console.log("2️⃣ Deploying PetitionRegistry...");
    const PetitionRegistry = await hre.ethers.getContractFactory("PetitionRegistry");
    const petitionRegistry = await PetitionRegistry.deploy();
    await petitionRegistry.waitForDeployment();
    const petitionRegistryAddress = await petitionRegistry.getAddress();
    console.log(`   ✅ PetitionRegistry: ${petitionRegistryAddress}\n`);

    // 3. Deploy EscrowMilestones (requires registry addresses)
    console.log("3️⃣ Deploying EscrowMilestones...");
    const votingWindowSeconds = 86400n; // 24 hours for voting
    const EscrowMilestones = await hre.ethers.getContractFactory("EscrowMilestones");
    const escrowMilestones = await EscrowMilestones.deploy(
        petitionRegistryAddress,
        implementerRegistryAddress,
        votingWindowSeconds
    );
    await escrowMilestones.waitForDeployment();
    const escrowMilestonesAddress = await escrowMilestones.getAddress();
    console.log(`   ✅ EscrowMilestones: ${escrowMilestonesAddress}\n`);

    // Output summary
    console.log("═".repeat(50));
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("═".repeat(50));
    console.log("\nContract Addresses:");
    console.log(`PETITION_REGISTRY_ADDRESS=${petitionRegistryAddress}`);
    console.log(`IMPLEMENTER_REGISTRY_ADDRESS=${implementerRegistryAddress}`);
    console.log(`ESCROW_MILESTONES_ADDRESS=${escrowMilestonesAddress}`);
    console.log("\n📋 Copy these to indexer-api/.env\n");

    // Save addresses to file
    const addresses = {
        petitionRegistry: petitionRegistryAddress,
        implementerRegistry: implementerRegistryAddress,
        escrowMilestones: escrowMilestonesAddress,
        network: "sepolia",
        chainId: 11155111,
        deployedAt: new Date().toISOString(),
    };

    const outputDir = path.join(__dirname, "..", "..", "shared");
    fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, "deployed-addresses.json");
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
    console.log(`📁 Addresses saved to: shared/deployed-addresses.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
