/**
 * OpenReform Contract Deployment Script
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

    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    console.log(`Deployer: ${deployer.account.address}`);
    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log(`Balance: ${balance} wei\n`);

    // 1. Deploy ImplementerRegistry
    console.log("1️⃣ Deploying ImplementerRegistry...");
    const implementerRegistry = await hre.viem.deployContract("ImplementerRegistry");
    console.log(`   ✅ ImplementerRegistry: ${implementerRegistry.address}\n`);

    // 2. Deploy PetitionRegistry
    console.log("2️⃣ Deploying PetitionRegistry...");
    const petitionRegistry = await hre.viem.deployContract("PetitionRegistry");
    console.log(`   ✅ PetitionRegistry: ${petitionRegistry.address}\n`);

    // 3. Deploy EscrowMilestones (requires registry addresses)
    console.log("3️⃣ Deploying EscrowMilestones...");
    const votingWindowSeconds = BigInt(86400); // 24 hours for voting
    const escrowMilestones = await hre.viem.deployContract("EscrowMilestones", [
        petitionRegistry.address,
        implementerRegistry.address,
        votingWindowSeconds,
    ]);
    console.log(`   ✅ EscrowMilestones: ${escrowMilestones.address}\n`);

    // Output summary
    console.log("═".repeat(50));
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("═".repeat(50));
    console.log("\nContract Addresses:");
    console.log(`PETITION_REGISTRY_ADDRESS=${petitionRegistry.address}`);
    console.log(`IMPLEMENTER_REGISTRY_ADDRESS=${implementerRegistry.address}`);
    console.log(`ESCROW_MILESTONES_ADDRESS=${escrowMilestones.address}`);
    console.log("\n📋 Copy these to indexer-api/.env and shared/constants.ts\n");

    // Save addresses to file
    const addresses = {
        petitionRegistry: petitionRegistry.address,
        implementerRegistry: implementerRegistry.address,
        escrowMilestones: escrowMilestones.address,
        network: "sepolia",
        deployedAt: new Date().toISOString(),
    };

    const outputPath = path.join(__dirname, "..", "..", "shared", "deployed-addresses.json");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
    console.log(`📁 Addresses saved to: ${outputPath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
