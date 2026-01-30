# OpenReform Indexer API

Event indexer and REST API for the OpenReform decentralized petition platform.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (edit .env with your Pinata keys)
cp .env.example .env

# Start development server
npm run dev
```

The server runs on `http://localhost:3001` by default.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check and indexer status |
| GET | `/api/petitions` | List all petitions |
| GET | `/api/petitions/:id` | Petition details with timeline |
| GET | `/api/petitions/:id/timeline` | Event timeline for petition |
| POST | `/api/ipfs/pin` | Pin JSON content to IPFS |
| GET | `/api/ipfs/status` | IPFS service status |
| GET | `/api/events/raw` | Raw events (debugging) |

## Configuration

Set the following in `.env`:

```env
# Server
PORT=3001

# Ethereum (Sepolia)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CHAIN_ID=11155111

# Contract Addresses (from Module A)
PETITION_REGISTRY_ADDRESS=
ESCROW_MILESTONES_ADDRESS=
IMPLEMENTER_REGISTRY_ADDRESS=

# IPFS - Pinata (get free key at pinata.cloud)
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
```

## For Frontend Team (Module C)

Example API requests:

```javascript
// List petitions
const response = await fetch('http://localhost:3001/api/petitions');
const { petitions } = await response.json();

// Get petition timeline
const timeline = await fetch('http://localhost:3001/api/petitions/1/timeline');
const { events } = await timeline.json();

// Pin content to IPFS
const pinResponse = await fetch('http://localhost:3001/api/ipfs/pin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: { title: 'My Petition', description: '...' },
    name: 'petition-content'
  })
});
const { cid, gateway } = await pinResponse.json();
```

## Mock Mode

When contract addresses are not configured, the server runs in mock mode with sample petition data for testing.
