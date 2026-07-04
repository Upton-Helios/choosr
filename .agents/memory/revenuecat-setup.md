---
name: RevenueCat one-time purchase setup (Choosr mobile)
description: Decisions and gotchas from wiring RevenueCat non-subscription IAP into an Expo app
---

- Test Store API rejects product `type: "one_time"` — use `type: "non_consumable"` for one-time (non-subscription) purchases when creating products via the RevenueCat Admin API.
- No auto-generated RevenueCat API helper existed for this project; had to hand-build a client using `@replit/revenuecat-sdk`'s `createClient` + `ReplitConnectors().createProxyFetch("revenuecat")`, base URL `https://api.revenuecat.com/v2`. Put this kind of one-off seeding/admin script in `scripts/src/` with its own npm script, not in the app itself.
- Native `Alert.alert`/browser `confirm()` dialogs are unreliable in the Playwright-based e2e testing harness for Expo web preview — paywalls must use a custom in-app `Modal` for purchase confirmation (especially in test mode) so tests can interact with it.
- Source of truth for premium/entitlement gating should be RevenueCat's `customerInfo.entitlements.active[...]` via a shared `useSubscription()` hook (React Query), not a local AsyncStorage flag — remove any pre-existing local "isPremium"/"unlockPremium" state once RevenueCat is wired in, to avoid two conflicting sources of truth.
- RevenueCat works out of the box on web and in Expo Go via "Preview API Mode" (JS mocks replace native calls) — no native build needed to test the full purchase flow end-to-end, including in the Playwright test harness against the Expo web preview.
