## 2025-05-18 - Context-Driven Re-renders
**Learning:** The `ParentModePage` consumes `useUserData` context, which updates frequently (e.g. points change). This causes the entire page and its children (like `ScoreChart`) to re-render, even if their data hasn't changed.
**Action:** Always verify if expensive components (charts, lists) used in context-heavy pages are memoized with `React.memo`.
