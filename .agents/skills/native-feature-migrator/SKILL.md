---
name: native-feature-migrator
description: Convert an existing React, web, or Capacitor feature completely to native Android with Kotlin and Jetpack Compose and native iOS with Swift and SwiftUI. Use when the user asks to migrate, convert, rewrite, or verify a feature as 100% native on both mobile platforms. Do not treat a WebView wrapper, Capacitor plugin bridge, or visual-only port as a complete native conversion.
---

# Native Feature Migrator

Convert one user-selected feature end to end on both platforms while preserving its observable behavior and backend contracts.

Before planning or implementing a migration, read [references/native-definition-of-done.md](references/native-definition-of-done.md). Use it as the acceptance contract, not as an optional suggestion.

## Establish the migration boundary

Inspect the current implementation before editing. Identify every entry point and variant of the feature, including screens, dialogs, routes, shared components, backend functions, database tables, caches, analytics, permissions, notifications, deep links, media, accessibility behavior, premium gates, error states, and tests.

Create a parity matrix that maps each current behavior to:

- Android owner and implementation;
- iOS owner and implementation;
- shared backend or contract;
- offline/persistence behavior;
- test or other verification evidence;
- status: missing, partial, implemented, verified, or intentionally excluded by the user.

Do not assume that similarly named screens are one implementation. Trace all feature variants and consolidate inconsistent behavior deliberately.

If the requested behavior or product decision is materially ambiguous, present the discovered variants and ask one focused question. Otherwise preserve existing user-visible behavior and proceed.

## What counts as native

Android UI must be Kotlin with Jetpack Compose and use Android platform APIs or maintained native libraries. iOS UI must be Swift with SwiftUI and use Apple platform APIs or maintained native libraries.

The following do not count as native completion:

- displaying the existing site or React component in WebView, WKWebView, Custom Tabs, or Safari View Controller;
- adding only a Capacitor/Cordova bridge while keeping the feature UI and state in JavaScript;
- recreating only the first screen while generation, persistence, offline behavior, navigation, or error handling still returns to the web implementation;
- leaving one platform as a stub, placeholder, feature flag permanently off, or unverified build;
- duplicating UI without migrating accessibility, lifecycle, state restoration, analytics, and failure states.

A shared backend is allowed and normally preferred. "Native" applies to the mobile presentation, interaction, local state, platform integration, and navigation layers; it does not require duplicating a valid server implementation.

## Implementation rules

Preserve existing API payloads and database contracts unless a schema change is necessary. When changing a shared contract, make the rollout backward-compatible or explicitly coordinate the cutover.

Use the repository's established Android and iOS architecture when it is sound. If native projects are generated only during CI or absent from source control, report that as a blocker to a durable migration and create/version stable native project structure before placing substantial feature code in workflow patches.

Model the same domain concepts on both platforms. Keep platform UI idiomatic rather than forcing pixel-identical code. Match behavior, information hierarchy, design tokens, accessibility semantics, and expected results.

Handle loading, empty, cached, offline, retry, permission-denied, authentication-expired, premium-gated, partial-data, and server-error states. Avoid blank frames and full-screen color flashes during navigation.

Use native navigation and preserve back/gesture behavior, deep links, state restoration, process death on Android, and app termination/relaunch on iOS. Internal feature navigation must not reload or open the WebView.

Use native secure storage for secrets/tokens and appropriate local persistence for user data. Never move server secrets into either client.

Do not remove the working web implementation until both native versions pass the acceptance contract and the user has authorized the cutover. Prefer a reversible feature flag during rollout when the application is already in production.

## Verification

Build and test both platforms. A compile-only result is partial.

Verify the feature with unit tests for domain rules, integration tests for persistence/network boundaries, UI tests for primary and failure flows, and at least one realistic device or emulator/simulator run per platform. For interaction or rendering defects, test on physical devices when available.

Compare the result against the parity matrix. Record evidence for every required row. Do not report "100% converted" when any required row is missing, partial, untested, dependent on the old web UI, or excluded without the user's explicit agreement.

## Handoff language

Report separately:

- Android implementation percentage;
- iOS implementation percentage;
- cross-platform parity percentage;
- verification percentage;
- remaining WebView dependency for the feature;
- known gaps and rollout status.

Only say **100% native** when the definition-of-done gate passes on both platforms. Otherwise use precise language such as "UI migrated, persistence pending" or "implemented on Android; iOS not verified."
