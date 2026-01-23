import { describe, it } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ScoreChart from './ScoreChart';
import { ScoreEntry } from '../types';

describe('ScoreChart', () => {
  it('renders without crashing with empty scores', () => {
    const div = document.createElement('div');
    const root = createRoot(div);
    root.render(<ScoreChart scores={[]} />);
    root.unmount();
  });

  it('renders without crashing with some scores', () => {
    const div = document.createElement('div');
    const root = createRoot(div);
    const scores: ScoreEntry[] = [
      { id: 1, date: '2023-01-01', subject: '國語', testType: '小考', score: 90 },
      { id: 2, date: '2023-01-02', subject: '數學', testType: '大考', score: 85 }
    ];
    root.render(<ScoreChart scores={scores} />);
    root.unmount();
  });
});
