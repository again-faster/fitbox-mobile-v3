# fitbox v2

Complete rebuil

## TRANSLATION

Make sure to place text to translations files.

```
- DashboardScreen   |   src\translations\en\dashboard.json
- Landing           |   src\translations\en\landing.json
```

## COMPONENTS

In creating screens, make sure to follow atomic design methodology and place it under `\src\components`

### Atom

These are the basic building blocks and the smallest functional units. In web design, an atom could be a button, a text field, or an icon. In software development, it might be a basic function or a variable.

### Molecules

When atoms are combined, they form molecules. In the context of a website, a molecule could be a form field (label + input + button) which combines multiple atoms.

### Organisms

Molecules come together to form organisms, which are relatively complex UI components. An example might be a header on a website that includes the logo, navigation, and search form (each of these components being a molecule).

### Templates

These are groups of organisms stitched together to form pages or sections of an interface. Templates provide a context for organisms to interact and serve as the backbone of a design system.

## Conventional commits:

In creating commits, always follow the conventional commits.

Please refer to: https://kapeli.com/cheat_sheets/Conventional_Commits.docset/Contents/Resources/Documents/index

# PROGRESS
All screens must be in the `src/screens` folder. Below screens are from the old app and needs to be updated. Implement them carefully and make sure to follow the design guidelines.

From `./src/screens/common`
- AboutScreen
- AcceptedWaiversScreen
- AuthLoading
- BillingAgreementScreen
- BookingsScreen
- BottomNavIcon
- BrowseMediaScreen
- CalendarScreen
- Camera
- CardInfoScreen
- ClassResultsScreen
- ComposeScreen
- ContactsScreen
- ConversationScreen
- EULAScreen
- FitboxGalleryScreen
- ForgotPasswordScreen
- GymWaiverScreen
- HealthCaptureScreen
- InboxScreen
- InboxSettingsScreen
- Landing - DONE
- Login - 20% (waiting for API)
- MenuScreen - 80% (needs to be updated)
- PaymentInformation
- PaymentUpdate
- PDFViewerScreen
- PowerBIScreen
- ProfileMenuScreen
- ProfileScreen
- ScoreCommentsScreen
- Screen
- SelectGymScreen
- SelectUserScreen
- SignUp
- SubscriptionDetails
- Subscriptions
- SubscriptionSetup
- SwitchUserScreen
- WebViewScreen
- WorkoutPerformance
- WorkoutScore

From `./src/screens/member`
- AddReportDataScreen
- AddWorkoutResult
- ClassFilterScreen
- CompletedScreen
- LeaderboardScreen
- MemberAttendance
- MemberDashboard
- MovementScreen
- PastPerformance
- ReportScreen
- ReportSettingsScreen
- ScoreScreen
- ScoreSubmission
- ScoreUpdate
- ScoringScreen
- UpdateWorkoutResult
- WellnessScreen
- WorkoutPastPerformance
- WorkoutsScreen