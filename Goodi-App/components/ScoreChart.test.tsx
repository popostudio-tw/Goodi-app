import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect } from 'vitest';
import ScoreChart from './ScoreChart';
import { ScoreEntry } from '../types';

describe('ScoreChart', () => {
    it('renders "insufficient data" message when scores < 2', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        const mockScores: ScoreEntry[] = [
            { id: 1, date: '2023-01-01', subject: '國語', testType: '小考', score: 90 }
        ];

        act(() => {
            root.render(<ScoreChart scores={mockScores} />);
        });

        expect(container.textContent).toContain('成績紀錄少於兩筆');

        act(() => {
            root.unmount();
        });
        document.body.removeChild(container);
    });

    it('renders chart when scores >= 2', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        const mockScores: ScoreEntry[] = [
            { id: 1, date: '2023-01-01', subject: '國語', testType: '小考', score: 90 },
            { id: 2, date: '2023-01-02', subject: '數學', testType: '小考', score: 85 }
        ];

        act(() => {
            root.render(<ScoreChart scores={mockScores} />);
        });

        // Check if SVG is rendered
        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();

        // Check if legends are rendered (subject names)
        expect(container.textContent).toContain('國語');
        expect(container.textContent).toContain('數學');

        act(() => {
            root.unmount();
        });
        document.body.removeChild(container);
    });
});
