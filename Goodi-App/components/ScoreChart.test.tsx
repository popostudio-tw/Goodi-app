import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import ScoreChart from './ScoreChart';
import { ScoreEntry } from '../types';

describe('ScoreChart', () => {
  let container: HTMLDivElement | null = null;
  let root: any = null;

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    if (container) {
      container.remove();
      container = null;
    }
  });

  it('renders without crashing', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    const mockScores: ScoreEntry[] = [
      { id: 1, date: '2023-01-01', subject: '數學', testType: '小考', score: 90 },
      { id: 2, date: '2023-01-02', subject: '英語', testType: '大考', score: 85 }
    ];

    await act(async () => {
      root.render(<ScoreChart scores={mockScores} />);
    });

    // Basic verification: check if SVG is present
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
