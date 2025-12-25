// Test environment setup
import { vi } from 'vitest';

// Mock Firebase
vi.mock('../firebase', () => ({
    functions: {},
    db: {},
    auth: {},
}));
