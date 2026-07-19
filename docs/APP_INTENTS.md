# Apple App Intents and universal links

fitbox exposes four iOS App Shortcuts on iOS 18 and newer:

- Today's Training
- Tomorrow's Training
- Wellness Check-in
- Book a Service

The intents open universal links handled by React Navigation:

| Destination | Universal link |
| --- | --- |
| Today's Training | `https://fitbox.iq/app/training/today` |
| Date-specific Training | `https://fitbox.iq/app/training/day/YYYY-MM-DD` |
| Wellness Check-in | `https://fitbox.iq/app/training/wellness` |
| Bookings | `https://fitbox.iq/app/training/bookings` |

## Website deployment required

Copy `docs/apple-app-site-association` to:

`https://fitbox.iq/.well-known/apple-app-site-association`

The endpoint must:

- return HTTP 200 without a redirect;
- use `application/json` as its content type;
- serve the file without a filename extension;
- remain publicly accessible to Apple's CDN.

Until that file is live, App Intents can appear in Siri and Shortcuts, but iOS
may open the links in the browser instead of routing into the installed app.

## Apple configuration

The App ID and provisioning profile for `com.againfaster.fitbox` must include
the Associated Domains capability. Regenerate the App Store provisioning
profile after enabling it in the Apple Developer portal.

No separate Intents extension is required because these intents only open app
destinations. `FitboxAppIntents.swift` is compiled into the main app target.

## Validation on a signed build

1. Install the TestFlight build on an iPhone running iOS 18 or newer.
2. Open fitbox once and sign in.
3. In Shortcuts, confirm the four fitbox actions are discoverable.
4. Test each suggested phrase with Siri.
5. Confirm tomorrow's phrase opens the correct local-calendar date.
6. Confirm cold-start and already-running navigation both work.

Apple's predefined App Shortcut phrases include the app name. A user who wants
the exact phrase "What's my workout tomorrow?" can add the action to a personal
Shortcut and give that shortcut the shorter phrase.
