# API Schema Documentation

REST API schema for the OpenReform Indexer API.

## Base URL
```
http://localhost:3001/api
```

---

## Petitions

### GET /api/petitions
List all petitions.

**Response:**
```json
{
  "petitions": [
    {
      "petitionId": "1",
      "creator": "0x1234...",
      "contentCID": "QmYwAP...",
      "status": "active",
      "supporterCount": 5,
      "totalFunded": "2000000000000000000",
      "implementer": "0x5678...",
      "implementerProfileCID": "QmZoWz...",
      "milestones": [],
      "createdAt": 1706601600,
      "lastUpdated": 1706688000
    }
  ],
  "total": 1
}
```

### GET /api/petitions/:id
Get petition details with timeline.

**Response:**
```json
{
  "petition": { ... },
  "timeline": [
    { "type": "PetitionCreated", ... },
    { "type": "Supported", ... }
  ]
}
```

### GET /api/petitions/:id/timeline
Get event timeline for a petition.

**Response:**
```json
{
  "events": [
    {
      "type": "PetitionCreated",
      "petitionId": "1",
      "creator": "0x1234...",
      "contentCID": "QmYwAP...",
      "timestamp": 1706601600,
      "blockNumber": 1000,
      "txHash": "0xabc..."
    }
  ],
  "total": 1
}
```

---

## IPFS

### POST /api/ipfs/pin
Pin JSON content to IPFS.

**Request:**
```json
{
  "content": { "title": "Petition Title", "description": "..." },
  "name": "optional-name"
}
```

**Response:**
```json
{
  "cid": "QmYwAPJzv5...",
  "gateway": "https://gateway.pinata.cloud/ipfs/QmYwAPJzv5...",
  "timestamp": 1706688000000
}
```

### GET /api/ipfs/status
Check IPFS service status.

**Response:**
```json
{
  "configured": true,
  "provider": "pinata"
}
```

---

## Events

### GET /api/events/raw
Get raw events for debugging.

**Query Params:**
- `limit` (optional): Max events to return (default: 50, max: 500)

**Response:**
```json
{
  "events": [ ... ],
  "lastBlock": 2000,
  "total": 10
}
```

---

## Health

### GET /api/health
Health check and indexer status.

**Response:**
```json
{
  "status": "ok",
  "indexer": {
    "running": true,
    "lastBlock": 2000,
    "eventsIndexed": 10,
    "configured": false
  },
  "timestamp": 1706688000000
}
```
