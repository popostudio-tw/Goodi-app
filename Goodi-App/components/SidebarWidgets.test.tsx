import { describe, it, expect, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import SidebarWidgets from './SidebarWidgets';

// Mock UserContext
vi.mock('../UserContext', () => ({
  useUserData: () => ({
    userData: {
      userProfile: { nickname: 'TestUser' },
      tasks: [],
      scoreHistory: [],
      transactions: [],
      keyEvents: [],
    },
    handleAddKeyEvent: vi.fn(),
    handleDeleteKeyEvent: vi.fn(),
    handleReportScore: vi.fn(),
  }),
}));

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  db: {},
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  onSnapshot: vi.fn(() => () => {}),
}));

// Mock API Client
vi.mock('../src/services/apiClient', () => ({
  getYesterdaySummary: vi.fn(),
}));

describe('SidebarWidgets', () => {
  it('renders without crashing', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<SidebarWidgets />);
    });

    // GreetingCard text should appear
    expect(container.textContent).toContain('TestUser');

    // Cleanup
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
