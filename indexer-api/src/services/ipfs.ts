/**
 * IPFS Pinning Service using Pinata REST API
 * Handles uploading content to IPFS and returns CID.
 * Uses direct fetch calls for better reliability.
 */

import { config } from '../config.js';

// Check if Pinata is configured
export function isPinataConfigured(): boolean {
    return !!(config.pinataApiKey && config.pinataSecretKey);
}

// Pin JSON content to IPFS using Pinata REST API
export async function pinJSON(content: object, name?: string): Promise<{ cid: string; gateway: string }> {
    if (!isPinataConfigured()) {
        throw new Error('Pinata API credentials not configured. Please set PINATA_API_KEY and PINATA_SECRET_KEY in .env');
    }

    try {
        const body = {
            pinataContent: content,
            pinataMetadata: name ? { name } : undefined,
        };

        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': config.pinataApiKey,
                'pinata_secret_api_key': config.pinataSecretKey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Pinata API error:', response.status, errorText);
            throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as { IpfsHash: string };

        return {
            cid: result.IpfsHash,
            gateway: `${config.pinataGateway}${result.IpfsHash}`,
        };
    } catch (error) {
        console.error('Failed to pin JSON to IPFS:', error);
        throw error;
    }
}

// Get gateway URL for a CID
export function getGatewayUrl(cid: string): string {
    return `${config.pinataGateway}${cid}`;
}

// Test Pinata connection
export async function testConnection(): Promise<boolean> {
    if (!isPinataConfigured()) {
        return false;
    }

    try {
        const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
            method: 'GET',
            headers: {
                'pinata_api_key': config.pinataApiKey,
                'pinata_secret_api_key': config.pinataSecretKey,
            },
        });

        return response.ok;
    } catch (error) {
        console.error('Pinata connection test failed:', error);
        return false;
    }
}
