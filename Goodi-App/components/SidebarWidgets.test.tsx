import { describe, it, vi, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import SidebarWidgets from './SidebarWidgets';

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

// Mock API client
vi.mock('../src/services/apiClient', () => ({
  getYesterdaySummary: vi.fn(() => Promise.resolve({ success: false })),
}));

// Mock UserContext
vi.mock('../UserContext', () => ({
  useUserData: () => ({
    userData: {
      userProfile: { nickname: 'TestUser' },
      tasks: [],
      scoreHistory: [],
      keyEvents: [],
      transactions: [],
    },
    handleAddKeyEvent: vi.fn(),
    handleDeleteKeyEvent: vi.fn(),
    handleReportScore: vi.fn(),
  }),
}));

describe('SidebarWidgets', () => {
  it('renders without crashing', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<SidebarWidgets />);
    });

    // Check if some content is rendered
    expect(container.innerHTML).toContain('TestUser'); // GreetingCard uses nickname

    // Clean up
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
