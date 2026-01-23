## 2024-05-23 - UserContext Value Not Memoized
**Learning:** The `UserContext` provider's `value` object is not memoized, causing all consumers to re-render on every provider update, regardless of which part of the state changed.
**Action:** In future refactors, wrap the `value` object in `useMemo` to isolate updates, but ensure all handlers are stable first (which we started doing today).
