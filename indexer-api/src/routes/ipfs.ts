/**
 * IPFS Pinning API Routes
 * Endpoints for pinning content to IPFS via Pinata.
 */

import { Router } from 'express';
import { pinJSON, isPinataConfigured, getGatewayUrl } from '../services/ipfs.js';

const router = Router();

// POST /api/ipfs/pin - Pin JSON content to IPFS
router.post('/pin', async (req, res) => {
    try {
        // Check if Pinata is configured
        if (!isPinataConfigured()) {
            return res.status(503).json({
                error: 'IPFS pinning not configured',
                message: 'Pinata API credentials not set. Please configure PINATA_API_KEY and PINATA_SECRET_KEY in .env',
            });
        }

        const { content, name } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Pin the content
        const result = await pinJSON(content, name);

        res.json({
            cid: result.cid,
            gateway: result.gateway,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Error pinning to IPFS:', error);
        res.status(500).json({ error: 'Failed to pin content to IPFS' });
    }
});

// GET /api/ipfs/gateway/:cid - Get gateway URL for a CID
router.get('/gateway/:cid', (req, res) => {
    const { cid } = req.params;
    const gateway = getGatewayUrl(cid);

    res.json({
        cid,
        gateway,
    });
});

// GET /api/ipfs/status - Check IPFS service status
router.get('/status', (req, res) => {
    res.json({
        configured: isPinataConfigured(),
        provider: 'pinata',
    });
});

export default router;
