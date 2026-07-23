import AppIntents
import Foundation

@available(iOS 18.0, *)
private enum FitboxIntentLink {
  static let today = URL(string: "https://fitbox.iq/app/training/today")!
  static let wellness = URL(string: "https://fitbox.iq/app/training/wellness")!
  static let bookings = URL(string: "https://fitbox.iq/app/training/bookings")!

  static var tomorrow: URL {
    let calendar = Calendar.autoupdatingCurrent
    let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date())!
    let formatter = DateFormatter()
    formatter.calendar = calendar
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = .autoupdatingCurrent
    formatter.dateFormat = "yyyy-MM-dd"
    let date = formatter.string(from: tomorrow)
    return URL(string: "https://fitbox.iq/app/training/day/\(date)")!
  }
}

@available(iOS 18.0, *)
struct OpenTodayTrainingIntent: AppIntent {
  static var title: LocalizedStringResource = "Today's Training"
  static var description = IntentDescription(
    "Opens today's assigned training in fitbox."
  )

  func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(FitboxIntentLink.today))
  }
}

@available(iOS 18.0, *)
struct OpenTomorrowTrainingIntent: AppIntent {
  static var title: LocalizedStringResource = "Tomorrow's Training"
  static var description = IntentDescription(
    "Opens tomorrow's assigned training in fitbox."
  )

  func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(FitboxIntentLink.tomorrow))
  }
}

@available(iOS 18.0, *)
struct OpenWellnessCheckInIntent: AppIntent {
  static var title: LocalizedStringResource = "Wellness Check-in"
  static var description = IntentDescription(
    "Opens the fitbox recovery and wellness check-in."
  )

  func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(FitboxIntentLink.wellness))
  }
}

@available(iOS 18.0, *)
struct OpenServiceBookingsIntent: AppIntent {
  static var title: LocalizedStringResource = "Book a Service"
  static var description = IntentDescription(
    "Opens personal training and service bookings in fitbox."
  )

  func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(FitboxIntentLink.bookings))
  }
}

@available(iOS 18.0, *)
struct FitboxAppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: OpenTodayTrainingIntent(),
      phrases: [
        "Open today's training in \(.applicationName)",
        "Log my workout in \(.applicationName)",
        "What's my workout today in \(.applicationName)"
      ],
      shortTitle: "Today's Training",
      systemImageName: "dumbbell.fill"
    )
    AppShortcut(
      intent: OpenTomorrowTrainingIntent(),
      phrases: [
        "What's my workout tomorrow in \(.applicationName)",
        "Open tomorrow's training in \(.applicationName)",
        "Show tomorrow's workout in \(.applicationName)"
      ],
      shortTitle: "Tomorrow's Training",
      systemImageName: "calendar"
    )
    AppShortcut(
      intent: OpenWellnessCheckInIntent(),
      phrases: [
        "Check in with \(.applicationName)",
        "Log my wellness in \(.applicationName)",
        "Open my \(.applicationName) recovery check-in"
      ],
      shortTitle: "Wellness Check-in",
      systemImageName: "heart.text.square.fill"
    )
    AppShortcut(
      intent: OpenServiceBookingsIntent(),
      phrases: [
        "Book personal training in \(.applicationName)",
        "Book a service in \(.applicationName)",
        "Open my \(.applicationName) bookings"
      ],
      shortTitle: "Book a Service",
      systemImageName: "calendar.badge.plus"
    )
  }
}
