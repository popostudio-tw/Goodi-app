## 2024-05-22 - [Context Subscription Anti-Pattern]
**Learning:** Components like `AiYesterdaySummary` were subscribing to `UserContext` via `useUserData()` without using the data, causing unnecessary re-renders whenever user data changed.
**Action:** Always check if context hooks are actually used. If a component is independent (fetches its own data), remove the context subscription.
