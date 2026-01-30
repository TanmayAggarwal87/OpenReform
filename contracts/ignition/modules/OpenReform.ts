/**
 * OpenReform Ignition Deployment Module
 * Deploys all contracts to any network
 */

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OpenReformModule = buildModule("OpenReform", (m) => {
    // 1. Deploy ImplementerRegistry (no constructor args)
    const implementerRegistry = m.contract("ImplementerRegistry");

    // 2. Deploy PetitionRegistry (no constructor args)
    const petitionRegistry = m.contract("PetitionRegistry");

    // 3. Deploy EscrowMilestones (depends on both registries)
    const votingWindowSeconds = 86400n; // 24 hours voting window
    const escrowMilestones = m.contract("EscrowMilestones", [
        petitionRegistry,
        implementerRegistry,
        votingWindowSeconds,
    ]);

    return { implementerRegistry, petitionRegistry, escrowMilestones };
});

export default OpenReformModule;
