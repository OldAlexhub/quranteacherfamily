# Quran Teacher Family

**Arabic-first Quran teaching for Muslim families — free with ads**  
by Old Alex Hub | Package: `com.oldalexhub.quranteacherfamily`

---

## Features

- Full Arabic Quran reader (all 114 surahs via Al-Quran Cloud API)
- Word-by-word Arabic teacher mode
- Repeat practice (listen and repeat ayahs)
- Memorization tracker per learner
- Daily assignments with parent-created tasks
- Local learner profiles (no account required)
- Bookmarks and notes (local)
- Search (surah names, Arabic text, English meaning)
- Progress reports and exports
- Optional English meaning (Pickthall, public domain)
- Two recitation styles: Muallim (Al-Husary) and Mujawwad (Al-Husary)
- Three themes: Light, Warm, Dark
- Free with ads (banner + limited interstitial)

## Data sources

- **Arabic text**: Al-Quran Cloud API (alquran.cloud) — free, no key
- **English meaning**: Pickthall translation via Al-Quran Cloud
- **Audio**: Islamic Network CDN (cdn.islamic.network) — Husary murattal / mujawwad

## Monetization

- **Free with ads.**
- Banner ads: enabled in non-Quran screens (Home, Dashboard, Surah List, Progress, Settings)
- Interstitial ads: enabled, strictly limited to natural stopping points
- App Open ads: **disabled and removed**
- Rewarded ads: disabled
- Native ads: disabled
- No mediation in version 1

### AdMob configuration

Edit `src/config/adsConfig.ts` to update IDs:

```
ADMOB_APP_ID       = ca-app-pub-7831002909037560~3940431384
BANNER_AD_UNIT_ID  = ca-app-pub-7831002909037560/6305750596
INTERSTITIAL_AD_UNIT_ID = ca-app-pub-7831002909037560/6170019228
```

**Debug builds automatically use Google test IDs** (`__DEV__ === true`). Release builds use the real IDs.

### Interstitial rules (enforced in `interstitialAdService.ts`)

- Max 1 interstitial every 10 minutes
- Max 3 per session
- Minimum 3 minutes in app before first interstitial
- Every 3 completion events (assignments or practice sessions)
- Never during audio playback, Quran reading, or active practice
- Only after: completed assignment, completed practice session, exported report

---

## How to run

```bash
npm install
npm start           # Metro bundler
npm run android     # Run on device/emulator
```

## How to build release

```bash
# Check environment
python release.py --check-env

# Full release build
python release.py

# Skip screenshots
python release.py --skip-screenshots

# Validate ads config only
python release.py --validate-content-only
```

`release.py` automatically:
- Detects Java + Android SDK
- Validates AdMob config in `src/config/adsConfig.ts`
- Validates AndroidManifest has AdMob app ID metadata
- Validates INTERNET permission
- Builds release APK + AAB
- Copies to `releases/builds/`

## Android permissions

- `INTERNET` — Quran API, audio CDN, and ads
- `ACCESS_NETWORK_STATE` — AdMob connectivity check
- `POST_NOTIFICATIONS` — Optional daily reminders
- `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` — Audio playback

## Google Play Upload

1. `python release.py` → `releases/builds/QuranTeacherFamily-release.aab`
2. Create app in Play Console: `com.oldalexhub.quranteacherfamily`
3. Upload the `.aab`
4. Store listing: `store_assets/store-listing.md`
5. Data safety: `store_assets/data-safety-notes.md`
6. Set AdMob app ID in Play Console (matches manifest)
7. Families policy: review if targeting children

## Keystore backup

**IMPORTANT**: Back up `android/keystore/quranteacherfamily-release.keystore` securely.

---

*Quran Teacher Family — by Old Alex Hub*  
*Learning companion only. Does not replace a qualified Quran teacher.*
