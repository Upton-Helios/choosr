---
name: Expo web preview screenshot tool returns blank
description: The screenshot tool (app_preview) reliably returns a blank white image for this Expo mobile artifact's web preview, even when the app is running correctly.
---

The `screenshot` tool with `type=app_preview` against the Expo mobile artifact's web preview URL consistently returns a blank white image, regardless of what screen is actually rendered.

**Why:** Observed repeatedly across sessions — workflow logs show clean Metro bundling with zero errors and correct route navigation, but the screenshot capture itself comes back blank. This appears to be a timing/rendering quirk of the screenshot tool against the Expo web bundle, not an actual app bug.

**How to apply:** Don't treat a blank screenshot as evidence of a broken screen for this project. Cross-check with `refresh_all_logs` (Metro bundler output, browser console) for real errors instead. Only escalate to deeper debugging if logs also show errors/warnings.
