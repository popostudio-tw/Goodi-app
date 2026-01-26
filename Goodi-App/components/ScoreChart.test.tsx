import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import ScoreChart from './ScoreChart';
import { ScoreEntry } from '../types';

describe('ScoreChart', () => {
    it('renders empty state correctly', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        await act(async () => {
            root.render(<ScoreChart scores={[]} />);
        });

        expect(container.textContent).toContain('成績紀錄少於兩筆');

        // Cleanup
        root.unmount();
        document.body.removeChild(container);
    });

    it('renders chart with data', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const scores: ScoreEntry[] = [
            { id: 1, date: '2023-01-01', subject: '國語', testType: '小考', score: 90 },
            { id: 2, date: '2023-01-02', subject: '國語', testType: '小考', score: 95 }
        ];

        await act(async () => {
            root.render(<ScoreChart scores={scores} />);
        });

        // Check if SVG is rendered
        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(container.textContent).toContain('國語');

        // Cleanup
        root.unmount();
        document.body.removeChild(container);
    });
});
