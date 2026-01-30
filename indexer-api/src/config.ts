import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Server
    port: Number(process.env.PORT) || 3001,

    // Ethereum
    sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: Number(process.env.CHAIN_ID) || 11155111,

    // Contract Addresses
    petitionRegistryAddress: process.env.PETITION_REGISTRY_ADDRESS || '',
    escrowMilestonesAddress: process.env.ESCROW_MILESTONES_ADDRESS || '',
    implementerRegistryAddress: process.env.IMPLEMENTER_REGISTRY_ADDRESS || '',

    // IPFS / Pinata
    pinataApiKey: process.env.PINATA_API_KEY || '',
    pinataSecretKey: process.env.PINATA_SECRET_KEY || '',
    pinataGateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',

    // Indexer
    indexerStartBlock: Number(process.env.INDEXER_START_BLOCK) || 0,
    indexerPollIntervalMs: Number(process.env.INDEXER_POLL_INTERVAL_MS) || 15000,
};
