import Foundation

@available(iOS 18.0, *)
struct FitboxPublicMovementName: Decodable {
  let id: String
  let name: String
}

@available(iOS 18.0, *)
struct FitboxPublicBlockMovement: Decodable {
  let id: String
  let position: Int
  let sets: Int?
  let repsScheme: String?
  let weightKg: Double?
  let durationSeconds: Int?
  let distanceMeters: Double?
  let calories: Double?
  let movements: FitboxPublicMovementName

  enum CodingKeys: String, CodingKey {
    case id, position, sets, calories, movements
    case repsScheme = "reps_scheme"
    case weightKg = "weight_kg"
    case durationSeconds = "duration_seconds"
    case distanceMeters = "distance_meters"
  }
}

@available(iOS 18.0, *)
struct FitboxPublicSectionBlock: Decodable {
  let id: String
  let position: Int
  var blockMovements: [FitboxPublicBlockMovement]

  enum CodingKeys: String, CodingKey {
    case id, position
    case blockMovements = "block_movements"
  }
}

@available(iOS 18.0, *)
struct FitboxPublicWorkoutSection: Decodable {
  let id: String
  let name: String
  let position: Int
  let sectionMode: String
  let coachNotes: String?
  var sectionBlocks: [FitboxPublicSectionBlock]

  enum CodingKeys: String, CodingKey {
    case id, name, position
    case sectionMode = "section_mode"
    case coachNotes = "coach_notes"
    case sectionBlocks = "section_blocks"
  }
}

@available(iOS 18.0, *)
enum FitboxWorkoutSpeechFormatter {
  static let maxLength = 500

  static func format(
    workoutName: String,
    estimatedDurationMinutes: Int?,
    sections: [FitboxPublicWorkoutSection],
    dayName: String
  ) -> String {
    let day = dayName.prefix(1).uppercased() + String(dayName.dropFirst())
    var response = "\(day)'s workout is \(compact(workoutName))"
    if let duration = estimatedDurationMinutes, duration > 0 {
      response += ", about \(duration) minutes"
    }
    response += "."

    for section in sections.sorted(by: { $0.position < $1.position }) {
      guard let detail = sectionSummary(section) else { continue }
      let sentence = " \(compact(section.name)): \(detail)."
      if response.count + sentence.count <= maxLength {
        response += sentence
        continue
      }

      let remaining = maxLength - response.count - 2
      guard remaining > 12 else { break }
      response += " " + truncate(detail: "\(compact(section.name)): \(detail)", to: remaining) + "."
      break
    }

    if response.count > maxLength {
      response = truncate(detail: response, to: maxLength - 1) + "."
    }
    return response.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  private static func sectionSummary(_ section: FitboxPublicWorkoutSection) -> String? {
    if let notes = section.coachNotes {
      let summary = compact(notes)
      if !summary.isEmpty { return summary }
    }

    var seen = Set<String>()
    let movements = section.sectionBlocks
      .sorted(by: { $0.position < $1.position })
      .flatMap { $0.blockMovements.sorted(by: { $0.position < $1.position }) }
      .compactMap { movement -> String? in
        guard seen.insert(movement.movements.id).inserted else { return nil }
        return movementSummary(movement)
      }
    return movements.isEmpty ? nil : movements.joined(separator: ", ")
  }

  private static func movementSummary(_ movement: FitboxPublicBlockMovement) -> String? {
    let name = compact(movement.movements.name)
    guard !name.isEmpty else { return nil }

    var summary: String
    if let reps = movement.repsScheme, !compact(reps).isEmpty {
      summary = "\(compact(reps)) \(name)"
      if let sets = movement.sets, sets > 1 {
        summary = "\(sets) sets of \(summary)"
      }
    } else if let distance = movement.distanceMeters, distance > 0 {
      summary = "\(number(distance)) meters \(name)"
    } else if let duration = movement.durationSeconds, duration > 0 {
      summary = duration % 60 == 0
        ? "\(duration / 60) minutes \(name)"
        : "\(duration) seconds \(name)"
    } else if let calories = movement.calories, calories > 0 {
      summary = "\(number(calories)) calories \(name)"
    } else {
      summary = name
    }

    if let weight = movement.weightKg, weight > 0 {
      summary += " at \(number(weight)) kilograms"
    }
    return summary
  }

  private static func compact(_ value: String) -> String {
    value.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
  }

  private static func number(_ value: Double) -> String {
    value.rounded() == value ? String(Int(value)) : String(format: "%g", value)
  }

  private static func truncate(detail: String, to limit: Int) -> String {
    guard detail.count > limit else { return detail }
    let prefix = String(detail.prefix(limit))
    if let boundary = prefix.lastIndex(where: { $0.isWhitespace }) {
      return String(prefix[..<boundary]).trimmingCharacters(in: .whitespacesAndNewlines)
    }
    return prefix
  }
}
