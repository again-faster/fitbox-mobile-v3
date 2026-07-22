import AppIntents
import Foundation
import Security

@available(iOS 18.0, *)
private enum FitboxWorkoutSummaryError: Error {
  case missingSession
  case expiredSession
  case invalidResponse
}

@available(iOS 18.0, *)
private struct FitboxAppIntentCredentials: Codable {
  let version: Int
  var accessToken: String
  var refreshToken: String
  var expiresAt: Double
  let userId: String
  let tenantId: String
  let fitboxApiKey: String
  let fitboxApiBase: String
  let mobileApiUrl: String
  let supabaseUrl: String
  let supabaseAnonKey: String
}

@available(iOS 18.0, *)
private struct FitboxTokenRefreshResponse: Decodable {
  let accessToken: String
  let refreshToken: String
  let expiresAt: Double

  enum CodingKeys: String, CodingKey {
    case accessToken = "access_token"
    case refreshToken = "refresh_token"
    case expiresAt = "expires_at"
  }
}

@available(iOS 18.0, *)
private struct FitboxWorkoutEnvelope: Decodable {
  let ok: Bool
  let data: [FitboxWorkoutAssignment]?
}

@available(iOS 18.0, *)
private struct FitboxWorkoutAssignment: Decodable {
  let notes: String?
  let workouts: FitboxAssignedWorkout
}

@available(iOS 18.0, *)
private struct FitboxAssignedWorkout: Decodable {
  let name: String
  let estimatedDurationMinutes: Int?

  enum CodingKeys: String, CodingKey {
    case name
    case estimatedDurationMinutes = "estimated_duration_minutes"
  }
}

@available(iOS 18.0, *)
private enum FitboxWorkoutSummaryService {
  private static let keychainService = "com.againfaster.fitbox.app-intents"
  private static let keychainAccount = "fitbox-app-intents"

  static func spokenSummary(daysFromToday: Int) async -> String {
    let dayName = daysFromToday == 0 ? "today" : "tomorrow"
    do {
      var credentials = try readCredentials()
      if credentials.expiresAt <= Date().timeIntervalSince1970 + 30 {
        credentials = try await refresh(credentials)
      }
      let assignments = try await fetchAssignments(
        credentials: credentials,
        daysFromToday: daysFromToday
      )
      return format(assignments: assignments, dayName: dayName)
    } catch FitboxWorkoutSummaryError.missingSession {
      return "Open fitbox Preview and sign in to Training, then ask me again."
    } catch FitboxWorkoutSummaryError.expiredSession {
      return "Your fitbox Training session needs refreshing. Open fitbox Preview, then ask me again."
    } catch {
      return "I couldn't load your fitbox workout right now. Please try again or open fitbox Preview."
    }
  }

  private static func readCredentials() throws -> FitboxAppIntentCredentials {
    let query: [CFString: Any] = [
      kSecClass: kSecClassGenericPassword,
      kSecAttrService: keychainService,
      kSecAttrAccount: keychainAccount,
      kSecReturnData: true,
      kSecMatchLimit: kSecMatchLimitOne
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess, let data = item as? Data else {
      throw FitboxWorkoutSummaryError.missingSession
    }
    return try JSONDecoder().decode(FitboxAppIntentCredentials.self, from: data)
  }

  private static func writeCredentials(_ credentials: FitboxAppIntentCredentials) throws {
    let data = try JSONEncoder().encode(credentials)
    let query: [CFString: Any] = [
      kSecClass: kSecClassGenericPassword,
      kSecAttrService: keychainService,
      kSecAttrAccount: keychainAccount
    ]
    let update: [CFString: Any] = [kSecValueData: data]
    let status = SecItemUpdate(query as CFDictionary, update as CFDictionary)
    if status == errSecItemNotFound {
      var add = query
      add[kSecValueData] = data
      add[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
      guard SecItemAdd(add as CFDictionary, nil) == errSecSuccess else {
        throw FitboxWorkoutSummaryError.expiredSession
      }
    } else if status != errSecSuccess {
      throw FitboxWorkoutSummaryError.expiredSession
    }
  }

  private static func refresh(
    _ credentials: FitboxAppIntentCredentials
  ) async throws -> FitboxAppIntentCredentials {
    guard !credentials.refreshToken.isEmpty,
          !credentials.supabaseUrl.isEmpty,
          !credentials.supabaseAnonKey.isEmpty else {
      throw FitboxWorkoutSummaryError.expiredSession
    }
    let base = credentials.supabaseUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard let url = URL(string: "\(base)/auth/v1/token?grant_type=refresh_token") else {
      throw FitboxWorkoutSummaryError.expiredSession
    }
    var request = URLRequest(url: url, timeoutInterval: 15)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(credentials.supabaseAnonKey, forHTTPHeaderField: "apikey")
    request.httpBody = try JSONEncoder().encode([
      "refresh_token": credentials.refreshToken
    ])

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse,
          (200..<300).contains(http.statusCode) else {
      throw FitboxWorkoutSummaryError.expiredSession
    }
    let refreshed = try JSONDecoder().decode(FitboxTokenRefreshResponse.self, from: data)
    var updated = credentials
    updated.accessToken = refreshed.accessToken
    updated.refreshToken = refreshed.refreshToken
    updated.expiresAt = refreshed.expiresAt
    try writeCredentials(updated)
    return updated
  }

  private static func fetchAssignments(
    credentials: FitboxAppIntentCredentials,
    daysFromToday: Int
  ) async throws -> [FitboxWorkoutAssignment] {
    guard !credentials.accessToken.isEmpty,
          !credentials.tenantId.isEmpty,
          !credentials.fitboxApiKey.isEmpty,
          !credentials.fitboxApiBase.isEmpty else {
      throw FitboxWorkoutSummaryError.missingSession
    }
    let date = Calendar.autoupdatingCurrent.date(
      byAdding: .day,
      value: daysFromToday,
      to: Date()
    )!
    let formatter = DateFormatter()
    formatter.calendar = .autoupdatingCurrent
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = .autoupdatingCurrent
    formatter.dateFormat = "yyyy-MM-dd"
    let dateValue = formatter.string(from: date)

    let base = credentials.mobileApiUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard var components = URLComponents(string: "\(base)/workouts") else {
      throw FitboxWorkoutSummaryError.invalidResponse
    }
    components.queryItems = [
      URLQueryItem(name: "tenantId", value: credentials.tenantId),
      URLQueryItem(name: "from", value: dateValue),
      URLQueryItem(name: "to", value: dateValue)
    ]
    guard let url = components.url else {
      throw FitboxWorkoutSummaryError.invalidResponse
    }

    var request = URLRequest(url: url, timeoutInterval: 15)
    request.setValue("Bearer \(credentials.accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.setValue(credentials.fitboxApiKey, forHTTPHeaderField: "x-fitbox-api-key")
    request.setValue(credentials.fitboxApiBase, forHTTPHeaderField: "x-fitbox-api-base")

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse else {
      throw FitboxWorkoutSummaryError.invalidResponse
    }
    if http.statusCode == 401 {
      throw FitboxWorkoutSummaryError.expiredSession
    }
    guard (200..<300).contains(http.statusCode) else {
      throw FitboxWorkoutSummaryError.invalidResponse
    }
    let envelope = try JSONDecoder().decode(FitboxWorkoutEnvelope.self, from: data)
    guard envelope.ok, let assignments = envelope.data else {
      throw FitboxWorkoutSummaryError.invalidResponse
    }
    return assignments
  }

  private static func format(
    assignments: [FitboxWorkoutAssignment],
    dayName: String
  ) -> String {
    guard !assignments.isEmpty else {
      return "You don't have a workout assigned for \(dayName)."
    }
    if assignments.count == 1, let assignment = assignments.first {
      var response = "Your workout \(dayName) is \(assignment.workouts.name)"
      if let duration = assignment.workouts.estimatedDurationMinutes, duration > 0 {
        response += ", about \(duration) minutes"
      }
      if let note = spokenNote(assignment.notes) {
        response += ". Your coach's note says: \(note)"
      }
      return response + "."
    }

    let entries = assignments.prefix(3).map { assignment in
      var entry = assignment.workouts.name
      if let duration = assignment.workouts.estimatedDurationMinutes, duration > 0 {
        entry += ", about \(duration) minutes"
      }
      return entry
    }
    var response = "You have \(assignments.count) workouts \(dayName): "
    response += ListFormatter.localizedString(byJoining: entries)
    if assignments.count > entries.count {
      response += ", and \(assignments.count - entries.count) more"
    }
    return response + "."
  }

  private static func spokenNote(_ note: String?) -> String? {
    guard let note else { return nil }
    let compact = note
      .split(whereSeparator: { $0.isWhitespace })
      .joined(separator: " ")
      .trimmingCharacters(in: .whitespacesAndNewlines)
    guard !compact.isEmpty else { return nil }
    if compact.count <= 160 { return compact }
    return String(compact.prefix(157)) + "..."
  }
}

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
struct ReadTodayWorkoutIntent: AppIntent {
  static var title: LocalizedStringResource = "Read Today's Workout"
  static var description = IntentDescription(
    "Reads a summary of today's assigned training in fitbox."
  )
  static var authenticationPolicy: IntentAuthenticationPolicy = .requiresAuthentication

  func perform() async throws -> some IntentResult & ProvidesDialog {
    let summary = await FitboxWorkoutSummaryService.spokenSummary(daysFromToday: 0)
    return .result(dialog: "\(summary)")
  }
}

@available(iOS 18.0, *)
struct ReadTomorrowWorkoutIntent: AppIntent {
  static var title: LocalizedStringResource = "Read Tomorrow's Workout"
  static var description = IntentDescription(
    "Reads a summary of tomorrow's assigned training in fitbox."
  )
  static var authenticationPolicy: IntentAuthenticationPolicy = .requiresAuthentication

  func perform() async throws -> some IntentResult & ProvidesDialog {
    let summary = await FitboxWorkoutSummaryService.spokenSummary(daysFromToday: 1)
    return .result(dialog: "\(summary)")
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
        "Log my workout in \(.applicationName)"
      ],
      shortTitle: "Today's Training",
      systemImageName: "dumbbell.fill"
    )
    AppShortcut(
      intent: OpenTomorrowTrainingIntent(),
      phrases: [
        "Open tomorrow's training in \(.applicationName)",
        "Show tomorrow's workout in \(.applicationName)"
      ],
      shortTitle: "Tomorrow's Training",
      systemImageName: "calendar"
    )
    AppShortcut(
      intent: ReadTodayWorkoutIntent(),
      phrases: [
        "What's my workout today in \(.applicationName)",
        "Read today's workout in \(.applicationName)"
      ],
      shortTitle: "Read Today's Workout",
      systemImageName: "speaker.wave.2.fill"
    )
    AppShortcut(
      intent: ReadTomorrowWorkoutIntent(),
      phrases: [
        "What's my workout tomorrow in \(.applicationName)",
        "Read tomorrow's workout in \(.applicationName)"
      ],
      shortTitle: "Read Tomorrow's Workout",
      systemImageName: "speaker.wave.2.fill"
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

@available(iOS 18.0, *)
@objc(FitboxAppShortcutsRegistrar)
public final class FitboxAppShortcutsRegistrar: NSObject {
  @objc public static func refresh() {
    FitboxAppShortcuts.updateAppShortcutParameters()
  }
}
