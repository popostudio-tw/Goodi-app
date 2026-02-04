import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ScoreChart from './ScoreChart';
import { ScoreEntry } from '../types';

describe('ScoreChart', () => {
  let container: HTMLDivElement | null = null;
  let root: any = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      container.remove();
    }
    container = null;
  });

  it('renders insufficient data message when scores count is less than 2', async () => {
    const scores: ScoreEntry[] = [
      { id: 1, date: '2023-10-26', subject: '國語', testType: '小考', score: 90 }
    ];

    await act(async () => {
      root.render(<ScoreChart scores={scores} />);
    });

    // Check for the "insufficient data" message
    expect(container?.textContent).toContain('成績紀錄少於兩筆');
  });

  it('renders SVG chart when scores count is 2 or more', async () => {
    const scores: ScoreEntry[] = [
      { id: 1, date: '2023-10-26', subject: '國語', testType: '小考', score: 90 },
      { id: 2, date: '2023-10-27', subject: '國語', testType: '小考', score: 95 }
    ];

    await act(async () => {
      root.render(<ScoreChart scores={scores} />);
    });

    // Check for SVG element
    const svg = container?.querySelector('svg');
    expect(svg).not.toBeNull();

    // Check for data points (circles)
    const circles = container?.querySelectorAll('circle');
    expect(circles?.length).toBeGreaterThan(0);
  });
});
