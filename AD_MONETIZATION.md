# Ad implementation and launch settings

The app uses the existing AdMob production banner and interstitial units; debug builds use Google test units. Banners are anchored adaptive, separated from navigation and content. AdMob controls successful banner refreshes; the app does not run a competing refresh timer. Reading, tafsir, lessons, recall, and recitation have no ads.

Interstitials preload at browsing screens, retry failed loads with 30-second to five-minute backoff, and replace inventory after 55 minutes. A loaded ad may appear only after an explicit return home from a completed session: every third completion, at least ten minutes apart, after three minutes of app use, and at most three per app session. Duplicate completion events, late loads, route changes, backgrounding, playback, unfinished lessons, and disabled advertising block display. No lesson or Quran passage is locked behind an ad.

Child-directed treatment, under-age-of-consent treatment, rating G, and nonpersonalized requests remain enabled. UMP controls whether requests may proceed. A failed consent refresh can use the SDK's existing valid consent state; the app never assumes consent. The server's adsEnabled switch is cached locally and refreshed in the background, including when the app returns to the foreground. Learning never waits for ads or the server.

Android SDK 14.11.0 omitted paid callbacks on standard interstitials and did not expose banner impressions separately. `scripts/patch-ads.cjs` applies guarded, idempotent fixes during npm installation. The dependency is pinned; reassess these patches before upgrading it. Impression callbacks and paid callbacks are recorded separately. Native currency micros are converted to currency units by the SDK, then normalized once into micros for telemetry. Load successes/failures include placement only; no learner or passage fields are sent. General analytics default on for new installations and remain optional. The owner dashboard therefore represents participating installations, not complete AdMob totals.

## Verify in AdMob before publishing

These account settings cannot be inferred from source code and have not been changed by this implementation:

- Enable Google-optimized automatic refresh for the banner unit.
- Enable impression-level ad revenue reporting; otherwise paid callbacks may be unavailable.
- Confirm the app and ad units are ready to serve, the correct Play package is linked, and the developer website's app-ads.txt authorizes publisher `pub-7831002909037560` using the exact entry provided by AdMob.
- Confirm the privacy message configuration and Families/content controls match this child-directed implementation.
- Review performance after launch by placement: load failures, impressions, estimated revenue, finalized earnings, and return rates. Do not infer a guaranteed revenue increase from these code changes.
- Mediation/bidding requires account setup and compatible, approved network adapters. No unconfigured networks were added; evaluate them against actual traffic and the app's child-directed audience before enabling them.

Deploy the updated server with the app: it accepts the new `ad_loaded` and `ad_failed` event types. Older server contracts will reject those telemetry batches. The Android release remains version 1.0.4/code 14 for the pre-upload rebuild.

References: [adaptive banners](https://developers.google.com/admob/android/banner), [interstitial cache expiry](https://developers.google.com/admob/android/interstitial), [paid events](https://developers.google.com/admob/android/impression-level-ad-revenue), [Google-optimized refresh](https://support.google.com/admob/answer/3245199), [Families treatment](https://support.google.com/admob/answer/6223431).
