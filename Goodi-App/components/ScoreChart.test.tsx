import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ScoreChart from './ScoreChart';
import { ScoreEntry, Subject, TestType } from '../types';
import { act } from 'react';

describe('ScoreChart', () => {
    let container: HTMLDivElement | null = null;
    let root: any = null;

    afterEach(() => {
        if (root) {
            act(() => root.unmount());
        }
        if (container) {
            container.remove();
        }
        container = null;
        root = null;
    });

    it('renders without crashing', () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        const mockScores: ScoreEntry[] = [
             { id: 1, date: '2023-10-01', subject: '國語' as Subject, testType: '小考' as TestType, score: 90 },
             { id: 2, date: '2023-10-02', subject: '數學' as Subject, testType: '小考' as TestType, score: 85 }
        ];

        act(() => {
             root.render(<ScoreChart scores={mockScores} />);
        });

        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
    });

    it('renders message when not enough scores', () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        const mockScores: ScoreEntry[] = [
             { id: 1, date: '2023-10-01', subject: '國語' as Subject, testType: '小考' as TestType, score: 90 }
        ];

        act(() => {
             root.render(<ScoreChart scores={mockScores} />);
        });

        expect(container.textContent).toContain('成績紀錄少於兩筆');
    });
});
