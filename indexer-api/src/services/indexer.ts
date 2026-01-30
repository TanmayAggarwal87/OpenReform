/**
 * On-Chain Event Indexer
 * Listens to Ethereum Sepolia for contract events and stores them.
 * 
 * Supports both real-time event listening and block polling.
 * Falls back to mock mode when contracts are not deployed.
 */

import { ethers } from 'ethers';
import { config } from '../config.js';
import { storeEvent, setLastIndexedBlock, getLastIndexedBlock } from './storage.js';
import type { ContractEvent } from '../../shared/event-schema.js';

// Contract ABIs (minimal - just the events we care about)
// These should be imported from /shared/abis once Module A deploys contracts
const PETITION_REGISTRY_ABI = [
    'event PetitionCreated(uint256 indexed petitionId, address indexed creator, string contentCID, uint256 timestamp)',
    'event Supported(uint256 indexed petitionId, address indexed supporter, uint256 timestamp)',
    'event Funded(uint256 indexed petitionId, address indexed funder, uint256 amount, uint256 timestamp)',
];

const ESCROW_MILESTONES_ABI = [
    'event MilestoneSubmitted(uint256 indexed petitionId, uint256 milestoneIndex, string proofCID, uint256 timestamp)',
    'event MilestoneApproved(uint256 indexed petitionId, uint256 milestoneIndex, address indexed approver, uint256 timestamp)',
    'event PayoutReleased(uint256 indexed petitionId, uint256 milestoneIndex, uint256 amount, address indexed implementer, uint256 timestamp)',
    'event RefundsClaimed(uint256 indexed petitionId, address indexed claimant, uint256 amount, uint256 timestamp)',
];

const IMPLEMENTER_REGISTRY_ABI = [
    'event ImplementerAccepted(uint256 indexed petitionId, address indexed implementer, string profileCID, uint256 timestamp)',
];

let provider: ethers.JsonRpcProvider | null = null;
let isRunning = false;
let pollInterval: NodeJS.Timer | null = null;

export function isIndexerRunning(): boolean {
    return isRunning;
}

export function getProvider(): ethers.JsonRpcProvider {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(config.sepoliaRpcUrl);
    }
    return provider;
}

// Check if contracts are configured
function areContractsConfigured(): boolean {
    return !!(
        config.petitionRegistryAddress &&
        config.escrowMilestonesAddress &&
        config.implementerRegistryAddress
    );
}

// Start the indexer
export async function startIndexer(): Promise<void> {
    if (isRunning) {
        console.log('[Indexer] Already running');
        return;
    }

    console.log('[Indexer] Starting...');

    if (!areContractsConfigured()) {
        console.log('[Indexer] Contracts not configured - running in mock mode');
        console.log('[Indexer] Set contract addresses in .env when Module A deploys');
        isRunning = true;
        return;
    }

    try {
        const p = getProvider();
        const currentBlock = await p.getBlockNumber();
        console.log(`[Indexer] Connected to Sepolia, current block: ${currentBlock}`);

        // Set up event listeners for each contract
        await setupContractListeners();

        // Start polling for past events
        await catchUpFromLastBlock();

        // Start periodic polling
        pollInterval = setInterval(pollForEvents, config.indexerPollIntervalMs);

        isRunning = true;
        console.log('[Indexer] Started successfully');
    } catch (error) {
        console.error('[Indexer] Failed to start:', error);
        throw error;
    }
}

// Stop the indexer
export function stopIndexer(): void {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    isRunning = false;
    console.log('[Indexer] Stopped');
}

// Set up real-time event listeners
async function setupContractListeners(): Promise<void> {
    const p = getProvider();

    // PetitionRegistry events
    if (config.petitionRegistryAddress) {
        const petitionRegistry = new ethers.Contract(
            config.petitionRegistryAddress,
            PETITION_REGISTRY_ABI,
            p
        );

        petitionRegistry.on('PetitionCreated', (petitionId, creator, contentCID, timestamp, event) => {
            handleEvent('PetitionCreated', {
                petitionId: petitionId.toString(),
                creator,
                contentCID,
                timestamp: Number(timestamp),
                blockNumber: event.log.blockNumber,
                txHash: event.log.transactionHash,
            });
        });

        petitionRegistry.on('Supported', (petitionId, supporter, timestamp, event) => {
            handleEvent('Supported', {
                petitionId: petitionId.toString(),
                supporter,
                timestamp: Number(timestamp),
                blockNumber: event.log.blockNumber,
                txHash: event.log.transactionHash,
            });
        });

        petitionRegistry.on('Funded', (petitionId, funder, amount, timestamp, event) => {
            handleEvent('Funded', {
                petitionId: petitionId.toString(),
                funder,
                amount: amount.toString(),
                timestamp: Number(timestamp),
                blockNumber: event.log.blockNumber,
                txHash: event.log.transactionHash,
            });
        });
    }

    // Add more contract listeners as needed...
    console.log('[Indexer] Event listeners set up');
}

// Handle an incoming event
function handleEvent(type: string, data: Record<string, unknown>): void {
    const event: ContractEvent = {
        type,
        ...data,
    } as unknown as ContractEvent;

    console.log(`[Indexer] Event received: ${type} for petition ${data.petitionId}`);
    storeEvent(event);
}

// Catch up from last indexed block
async function catchUpFromLastBlock(): Promise<void> {
    const lastBlock = getLastIndexedBlock();
    const p = getProvider();
    const currentBlock = await p.getBlockNumber();

    if (lastBlock >= currentBlock) return;

    console.log(`[Indexer] Catching up from block ${lastBlock} to ${currentBlock}`);

    // Query events in chunks
    const CHUNK_SIZE = 1000;
    for (let from = lastBlock; from <= currentBlock; from += CHUNK_SIZE) {
        const to = Math.min(from + CHUNK_SIZE - 1, currentBlock);
        await queryEventRange(from, to);
    }

    setLastIndexedBlock(currentBlock);
    console.log(`[Indexer] Caught up to block ${currentBlock}`);
}

// Poll for new events
async function pollForEvents(): Promise<void> {
    if (!areContractsConfigured()) return;

    try {
        const p = getProvider();
        const lastBlock = getLastIndexedBlock();
        const currentBlock = await p.getBlockNumber();

        if (currentBlock > lastBlock) {
            await queryEventRange(lastBlock + 1, currentBlock);
            setLastIndexedBlock(currentBlock);
        }
    } catch (error) {
        console.error('[Indexer] Poll error:', error);
    }
}

// Query events in a block range
async function queryEventRange(fromBlock: number, toBlock: number): Promise<void> {
    const p = getProvider();

    // Query each contract's events
    const contracts = [
        { address: config.petitionRegistryAddress, abi: PETITION_REGISTRY_ABI },
        { address: config.escrowMilestonesAddress, abi: ESCROW_MILESTONES_ABI },
        { address: config.implementerRegistryAddress, abi: IMPLEMENTER_REGISTRY_ABI },
    ];

    for (const { address, abi } of contracts) {
        if (!address) continue;

        const contract = new ethers.Contract(address, abi, p);
        const eventNames = abi
            .filter(item => item.startsWith('event '))
            .map(item => item.replace('event ', '').split('(')[0]);

        for (const eventName of eventNames) {
            try {
                const filter = contract.filters[eventName]?.();
                if (filter) {
                    const events = await contract.queryFilter(filter, fromBlock, toBlock);
                    for (const event of events) {
                        // Parse and store each event
                        // (Implementation depends on actual ABI parsing)
                    }
                }
            } catch (error) {
                console.error(`[Indexer] Error querying ${eventName}:`, error);
            }
        }
    }
}

// Get current indexer stats
export function getIndexerStats(): {
    running: boolean;
    lastBlock: number;
    configured: boolean;
} {
    return {
        running: isRunning,
        lastBlock: getLastIndexedBlock(),
        configured: areContractsConfigured(),
    };
}
