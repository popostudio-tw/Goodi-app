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

    it('renders message when fewer than 2 scores are provided', async () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        const scores: ScoreEntry[] = [
            { id: 1, date: '2023-01-01', subject: '國語', testType: '小考', score: 90 }
        ];

        await act(async () => {
            root.render(<ScoreChart scores={scores} />);
        });

        expect(container.textContent).toContain('成績紀錄少於兩筆，尚無法繪製圖表');
    });

    it('renders chart when enough scores are provided', async () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        const scores: ScoreEntry[] = [
             { id: 1, date: '2023-01-01', subject: '國語', testType: '小考', score: 90 },
             { id: 2, date: '2023-01-02', subject: '國語', testType: '小考', score: 95 }
        ];

        await act(async () => {
             root.render(<ScoreChart scores={scores} />);
        });

        // Check for SVG presence
        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();

        // Check for subject text
        expect(container.textContent).toContain('國語');
    });
});
