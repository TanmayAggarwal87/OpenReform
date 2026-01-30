/**
 * In-Memory Storage Layer for OpenReform Indexer
 * Stores contract events and aggregated petition data.
 * 
 * For hackathon MVP, we use simple in-memory storage.
 * In production, replace with SQLite or PostgreSQL.
 */

import type {
    ContractEvent,
    Petition,
    PetitionStatus,
    MilestoneInfo,
    PetitionCreatedEvent,
    SupportedEvent,
    FundedEvent,
    ImplementerAcceptedEvent,
    MilestoneSubmittedEvent,
    MilestoneApprovedEvent,
    PayoutReleasedEvent,
    RefundsClaimedEvent,
} from '../../shared/event-schema.js';

// ===== Storage State =====
const events: ContractEvent[] = [];
const petitions: Map<string, Petition> = new Map();
let lastIndexedBlock = 0;

// ===== Event Storage =====

export function storeEvent(event: ContractEvent): void {
    events.push(event);
    updatePetitionFromEvent(event);
}

export function getEvents(): ContractEvent[] {
    return [...events];
}

export function getEventsByPetition(petitionId: string): ContractEvent[] {
    return events.filter(e => e.petitionId === petitionId);
}

export function getLastNEvents(n: number): ContractEvent[] {
    return events.slice(-n);
}

export function getEventsCount(): number {
    return events.length;
}

// ===== Petition Storage =====

export function getPetition(petitionId: string): Petition | undefined {
    return petitions.get(petitionId);
}

export function getAllPetitions(): Petition[] {
    return Array.from(petitions.values());
}

export function getPetitionsCount(): number {
    return petitions.size;
}

// ===== Block Tracking =====

export function getLastIndexedBlock(): number {
    return lastIndexedBlock;
}

export function setLastIndexedBlock(block: number): void {
    lastIndexedBlock = block;
}

// ===== Petition Aggregation Logic =====

function updatePetitionFromEvent(event: ContractEvent): void {
    const { petitionId, timestamp } = event;

    switch (event.type) {
        case 'PetitionCreated': {
            const e = event as PetitionCreatedEvent;
            petitions.set(petitionId, {
                petitionId,
                creator: e.creator,
                contentCID: e.contentCID,
                status: 'created' as PetitionStatus,
                supporterCount: 0,
                totalFunded: '0',
                milestones: [],
                createdAt: timestamp,
                lastUpdated: timestamp,
            });
            break;
        }

        case 'Supported': {
            const petition = petitions.get(petitionId);
            if (petition) {
                petition.supporterCount++;
                petition.status = 'active' as PetitionStatus;
                petition.lastUpdated = timestamp;
            }
            break;
        }

        case 'Funded': {
            const e = event as FundedEvent;
            const petition = petitions.get(petitionId);
            if (petition) {
                const current = BigInt(petition.totalFunded);
                const added = BigInt(e.amount);
                petition.totalFunded = (current + added).toString();
                petition.status = 'active' as PetitionStatus;
                petition.lastUpdated = timestamp;
            }
            break;
        }

        case 'ImplementerAccepted': {
            const e = event as ImplementerAcceptedEvent;
            const petition = petitions.get(petitionId);
            if (petition) {
                petition.implementer = e.implementer;
                petition.implementerProfileCID = e.profileCID;
                petition.status = 'accepted' as PetitionStatus;
                petition.lastUpdated = timestamp;
            }
            break;
        }

        case 'MilestoneSubmitted': {
            const e = event as MilestoneSubmittedEvent;
            const petition = petitions.get(petitionId);
            if (petition) {
                // Ensure milestone array is large enough
                while (petition.milestones.length <= e.milestoneIndex) {
                    petition.milestones.push({
                        index: petition.milestones.length,
                        approved: false,
                        paidOut: false,
                    });
                }
                petition.milestones[e.milestoneIndex].proofCID = e.proofCID;
                petition.milestones[e.milestoneIndex].submittedAt = timestamp;
                petition.status = 'in_progress' as PetitionStatus;
                petition.lastUpdated = timestamp;
            }
            break;
        }

        case 'MilestoneApproved': {
            const e = event as MilestoneApprovedEvent;
            const petition = petitions.get(petitionId);
            if (petition && petition.milestones[e.milestoneIndex]) {
                petition.milestones[e.milestoneIndex].approved = true;
                petition.milestones[e.milestoneIndex].approvedAt = timestamp;
                petition.milestones[e.milestoneIndex].approver = e.approver;
                petition.lastUpdated = timestamp;
            }
            break;
        }

        case 'PayoutReleased': {
            const e = event as PayoutReleasedEvent;
            const petition = petitions.get(petitionId);
            if (petition && petition.milestones[e.milestoneIndex]) {
                petition.milestones[e.milestoneIndex].paidOut = true;
                petition.milestones[e.milestoneIndex].payoutAmount = e.amount;

                // Check if all milestones are paid
                const allPaid = petition.milestones.every(m => m.paidOut);
                if (allPaid) {
                    petition.status = 'completed' as PetitionStatus;
                }
                petition.lastUpdated = timestamp;
            }
            break;
        }

        case 'RefundsClaimed': {
            const petition = petitions.get(petitionId);
            if (petition) {
                petition.status = 'refunded' as PetitionStatus;
                petition.lastUpdated = timestamp;
            }
            break;
        }
    }
}

// ===== Mock Data for Demo =====

export function addMockData(): void {
    // Add some mock petitions for demo purposes
    const now = Math.floor(Date.now() / 1000);

    const mockEvents: ContractEvent[] = [
        {
            type: 'PetitionCreated',
            petitionId: '1',
            creator: '0x1234567890123456789012345678901234567890',
            contentCID: 'QmYwAPJzv5CZsnAzt8auVZRn5CM3kRbNYQXBmkqJQJrxJR',
            timestamp: now - 86400, // 1 day ago
            blockNumber: 1000,
            txHash: '0xabc123...',
        } as PetitionCreatedEvent,
        {
            type: 'Supported',
            petitionId: '1',
            supporter: '0x2222222222222222222222222222222222222222',
            timestamp: now - 82800,
            blockNumber: 1010,
            txHash: '0xdef456...',
        } as SupportedEvent,
        {
            type: 'Funded',
            petitionId: '1',
            funder: '0x2222222222222222222222222222222222222222',
            amount: '1000000000000000000', // 1 ETH
            timestamp: now - 79200,
            blockNumber: 1020,
            txHash: '0xghi789...',
        } as FundedEvent,
        {
            type: 'PetitionCreated',
            petitionId: '2',
            creator: '0x3333333333333333333333333333333333333333',
            contentCID: 'QmZoWziPcGsLM6CLHPqqwsNqvBQhxMmtxkPtJhMjLJqQK3',
            timestamp: now - 3600, // 1 hour ago
            blockNumber: 2000,
            txHash: '0xjkl012...',
        } as PetitionCreatedEvent,
    ];

    for (const event of mockEvents) {
        storeEvent(event);
    }

    setLastIndexedBlock(2000);
}
