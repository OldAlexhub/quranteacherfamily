# Google Play Data Safety Notes

## Does this app collect user data?
YES — through Google AdMob (third-party SDK)

## What data is collected?
AdMob may collect advertising identifiers and device information for ad delivery, fraud prevention, and frequency capping. See Google's privacy policy for details.

The developer (Old Alex Hub) does not collect or receive user data.

## Does this app share user data with third parties?
YES — AdMob shares ad-related data with Google per Google's privacy policy.
Local learner data (profiles, notes, bookmarks, progress) is NOT shared.

## Is data encrypted in transit?
YES — ad requests use HTTPS.

## Can users request data deletion?
YES — local data: Settings → Reset all local data, or uninstall the app.
Ad-related data: see Google's ad personalization controls.

---

## Data types:

- Location: NO
- Personal info (name, email, phone, etc.): NO — learner names are optional and local only
- Financial info: NO
- Health info: NO
- Messages: NO
- Photos and videos: NO
- Audio files (user recordings): NO
- Files and docs (broad storage): NO
- App activity (sent to developer): NO — all activity is local
- App info and performance: AdMob may collect anonymized crash/performance data per Google's policy
- Device identifiers: AdMob may use advertising ID for ad delivery

## Analytics SDK: NONE from developer
## Advertising SDK: Google AdMob (Google Mobile Ads)
## Crash reporting: None explicitly added (AdMob SDK may include its own)

---

## Notes for Google Play Data Safety form:

### Data collected by third-party SDKs:
- Google Mobile Ads SDK (AdMob) collects device and advertising identifiers
- Declare: Device or other identifiers → Advertising ID
- Purpose: Advertising or marketing
- Is data shared? Yes (with Google per Google's privacy policy)

### Local learning data:
- Declare: No collection of personal info
- Learner profile names are entered by parent, stored locally only, never transmitted
- Note that learning data is stored locally and is not collected by the developer

### Internet usage:
- Internet required for: Quran text/audio from open APIs, ads
- Quran reading features continue offline once data is cached

### Children / Families:
- App may target children under parent supervision
- Configure appropriate child-directed treatment in Data Safety form
- Ad content rating: G
- Families self-certification: review requirements before submitting

### Permissions:
- INTERNET: Required (Quran content API, audio CDN, ads)
- ACCESS_NETWORK_STATE: Required by AdMob
- POST_NOTIFICATIONS: Optional reminders only
- FOREGROUND_SERVICE + MEDIA_PLAYBACK: Audio playback
