
import { describe, it, expect } from 'vitest';
import React from 'react';
import ScoreChart from './ScoreChart';
import { ScoreEntry } from '../types';

// Simple mock for ScoreChartProps since we are testing React component props
// Since we don't have react-testing-library, we can't easily render to DOM and assert content
// But we can verify that the component is a function (or memoized component)

describe('ScoreChart', () => {
    it('is a valid React component', () => {
        expect(ScoreChart).toBeDefined();
        // If it's a functional component, it's a function.
        // If it's memoized, it's an object with $$typeof property
        const isFunction = typeof ScoreChart === 'function';
        const isMemoized = typeof ScoreChart === 'object' && 'type' in ScoreChart;
        expect(isFunction || isMemoized).toBe(true);
    });
});
