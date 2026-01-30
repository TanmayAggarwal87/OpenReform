/**
 * Petitions API Routes
 * Endpoints for listing and viewing petitions and their timelines.
 */

import { Router } from 'express';
import {
    getAllPetitions,
    getPetition,
    getEventsByPetition,
    getPetitionsCount,
} from '../services/storage.js';

const router = Router();

// GET /api/petitions - List all petitions
router.get('/', (req, res) => {
    try {
        const petitions = getAllPetitions();

        // Sort by lastUpdated descending (newest first)
        petitions.sort((a, b) => b.lastUpdated - a.lastUpdated);

        res.json({
            petitions,
            total: petitions.length,
        });
    } catch (error) {
        console.error('Error fetching petitions:', error);
        res.status(500).json({ error: 'Failed to fetch petitions' });
    }
});

// GET /api/petitions/:id - Get petition details
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const petition = getPetition(id);

        if (!petition) {
            return res.json({
                petition: null,
                timeline: [],
            });
        }

        const timeline = getEventsByPetition(id);

        res.json({
            petition,
            timeline,
        });
    } catch (error) {
        console.error('Error fetching petition:', error);
        res.status(500).json({ error: 'Failed to fetch petition' });
    }
});

// GET /api/petitions/:id/timeline - Get petition event timeline
router.get('/:id/timeline', (req, res) => {
    try {
        const { id } = req.params;
        const petition = getPetition(id);

        if (!petition) {
            return res.status(404).json({ error: 'Petition not found' });
        }

        const events = getEventsByPetition(id);

        // Sort by timestamp ascending (oldest first for timeline)
        events.sort((a, b) => a.timestamp - b.timestamp);

        res.json({
            events,
            total: events.length,
        });
    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Failed to fetch timeline' });
    }
});

export default router;
