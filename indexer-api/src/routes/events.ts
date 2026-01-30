/**
 * Events API Routes
 * Endpoints for accessing raw event data (debugging/fallback).
 */

import { Router } from 'express';
import {
    getEvents,
    getLastNEvents,
    getEventsCount,
    getLastIndexedBlock,
} from '../services/storage.js';

const router = Router();

// GET /api/events/raw - Get raw events (for debugging)
router.get('/raw', (req, res) => {
    try {
        // Get optional limit parameter, default to 50
        const limit = Math.min(Number(req.query.limit) || 50, 500);

        const events = getLastNEvents(limit);

        res.json({
            events,
            lastBlock: getLastIndexedBlock(),
            total: getEventsCount(),
        });
    } catch (error) {
        console.error('Error fetching raw events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// GET /api/events/all - Get all events
router.get('/all', (req, res) => {
    try {
        const events = getEvents();

        res.json({
            events,
            lastBlock: getLastIndexedBlock(),
            total: events.length,
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// GET /api/events/count - Get event count
router.get('/count', (req, res) => {
    res.json({
        count: getEventsCount(),
        lastBlock: getLastIndexedBlock(),
    });
});

export default router;
