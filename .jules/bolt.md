## 2026-01-11 - [Context Splitting for Performance]
**Learning:** High-frequency UI state (like animations) co-located with heavy global data contexts causes massive unnecessary re-renders.
**Action:** Always separate frequent UI state (e.g., `isAnimating`, `isOpen`) into a dedicated `UIContext` or local state, keeping the main data context stable. Used `UIContext` for `isPointsAnimating` to fix this.
