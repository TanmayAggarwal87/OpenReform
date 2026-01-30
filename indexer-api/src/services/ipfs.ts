/**
 * IPFS Pinning Service using Pinata
 * Handles uploading content to IPFS and returns CID.
 */

import PinataClient from '@pinata/sdk';
import { config } from '../config.js';
import { Readable } from 'stream';

let pinata: PinataClient | null = null;

// Initialize Pinata client
function getPinata(): PinataClient {
    if (!pinata) {
        if (!config.pinataApiKey || !config.pinataSecretKey) {
            throw new Error('Pinata API credentials not configured. Please set PINATA_API_KEY and PINATA_SECRET_KEY in .env');
        }
        pinata = new PinataClient(config.pinataApiKey, config.pinataSecretKey);
    }
    return pinata;
}

// Check if Pinata is configured
export function isPinataConfigured(): boolean {
    return !!(config.pinataApiKey && config.pinataSecretKey);
}

// Pin JSON content to IPFS
export async function pinJSON(content: object, name?: string): Promise<{ cid: string; gateway: string }> {
    try {
        const client = getPinata();

        const options = name ? { pinataMetadata: { name } } : undefined;
        const result = await client.pinJSONToIPFS(content, options);

        return {
            cid: result.IpfsHash,
            gateway: `${config.pinataGateway}${result.IpfsHash}`,
        };
    } catch (error) {
        console.error('Failed to pin JSON to IPFS:', error);
        throw error;
    }
}

// Pin file content to IPFS
export async function pinFile(
    buffer: Buffer,
    filename: string
): Promise<{ cid: string; gateway: string }> {
    try {
        const client = getPinata();

        const stream = Readable.from(buffer);
        const options = {
            pinataMetadata: { name: filename },
        };

        const result = await client.pinFileToIPFS(stream, options);

        return {
            cid: result.IpfsHash,
            gateway: `${config.pinataGateway}${result.IpfsHash}`,
        };
    } catch (error) {
        console.error('Failed to pin file to IPFS:', error);
        throw error;
    }
}

// Get gateway URL for a CID
export function getGatewayUrl(cid: string): string {
    return `${config.pinataGateway}${cid}`;
}

// Test Pinata connection
export async function testConnection(): Promise<boolean> {
    try {
        const client = getPinata();
        const result = await client.testAuthentication();
        return result.authenticated === true;
    } catch (error) {
        console.error('Pinata connection test failed:', error);
        return false;
    }
}
