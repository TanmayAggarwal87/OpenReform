/**
 * Shared Event Schema for OpenReform Platform
 * These types define all contract events that the indexer tracks
 * and the API returns.
 */

// ===== Petition Status Enum =====
export enum PetitionStatus {
  Created = 'created',
  Active = 'active',        // Has supporters/funding
  Accepted = 'accepted',    // Implementer accepted
  InProgress = 'in_progress', // Milestones being worked on
  Completed = 'completed',  // All milestones approved
  Refunded = 'refunded',    // Deadline passed, refunds claimed
}

// ===== Base Event Interface =====
export interface BaseEvent {
  type: string;
  petitionId: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

// ===== Contract Events =====

export interface PetitionCreatedEvent extends BaseEvent {
  type: 'PetitionCreated';
  creator: string;
  contentCID: string;
}

export interface SupportedEvent extends BaseEvent {
  type: 'Supported';
  supporter: string;
}

export interface FundedEvent extends BaseEvent {
  type: 'Funded';
  funder: string;
  amount: string; // Wei as string to avoid precision issues
}

export interface ImplementerAcceptedEvent extends BaseEvent {
  type: 'ImplementerAccepted';
  implementer: string;
  profileCID: string;
}

export interface MilestoneSubmittedEvent extends BaseEvent {
  type: 'MilestoneSubmitted';
  milestoneIndex: number;
  proofCID: string;
}

export interface MilestoneApprovedEvent extends BaseEvent {
  type: 'MilestoneApproved';
  milestoneIndex: number;
  approver: string;
}

export interface PayoutReleasedEvent extends BaseEvent {
  type: 'PayoutReleased';
  milestoneIndex: number;
  amount: string;
  implementer: string;
}

export interface RefundsClaimedEvent extends BaseEvent {
  type: 'RefundsClaimed';
  claimant: string;
  amount: string;
}

// ===== Union Type for All Events =====
export type ContractEvent =
  | PetitionCreatedEvent
  | SupportedEvent
  | FundedEvent
  | ImplementerAcceptedEvent
  | MilestoneSubmittedEvent
  | MilestoneApprovedEvent
  | PayoutReleasedEvent
  | RefundsClaimedEvent;

// ===== Event Type Names =====
export const EventTypes = [
  'PetitionCreated',
  'Supported',
  'Funded',
  'ImplementerAccepted',
  'MilestoneSubmitted',
  'MilestoneApproved',
  'PayoutReleased',
  'RefundsClaimed',
] as const;

export type EventType = typeof EventTypes[number];

// ===== Aggregated Petition Type =====
export interface Petition {
  petitionId: string;
  creator: string;
  contentCID: string;
  status: PetitionStatus;
  supporterCount: number;
  totalFunded: string;
  implementer?: string;
  implementerProfileCID?: string;
  milestones: MilestoneInfo[];
  createdAt: number;
  lastUpdated: number;
}

export interface MilestoneInfo {
  index: number;
  proofCID?: string;
  submittedAt?: number;
  approved: boolean;
  approvedAt?: number;
  approver?: string;
  paidOut: boolean;
  payoutAmount?: string;
}

// ===== API Response Types =====
export interface PetitionListResponse {
  petitions: Petition[];
  total: number;
}

export interface PetitionDetailResponse {
  petition: Petition;
  timeline: ContractEvent[];
}

export interface TimelineResponse {
  events: ContractEvent[];
  total: number;
}

export interface RawEventsResponse {
  events: ContractEvent[];
  lastBlock: number;
  total: number;
}

export interface IPFSPinResponse {
  cid: string;
  gateway: string;
  timestamp: number;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  indexer: {
    running: boolean;
    lastBlock: number;
    eventsIndexed: number;
  };
  timestamp: number;
}
