@testable import fitbox
import XCTest

@available(iOS 18.0, *)
final class FitboxWorkoutSummaryTests: XCTestCase {
  func testFormatsMemberVisibleNotesForSpeech() {
    let sections = [
      FitboxPublicWorkoutSection(
        id: "strength",
        name: "Strength",
        position: 1,
        sectionMode: "workout",
        coachNotes: "Deadlift: 5 x 3 at a moderate load.",
        sectionBlocks: []
      ),
      FitboxPublicWorkoutSection(
        id: "metcon",
        name: "Metcon",
        position: 2,
        sectionMode: "workout",
        coachNotes: "18-minute EMOM with bike, dumbbell snatches, and burpees.",
        sectionBlocks: []
      )
    ]

    let result = FitboxWorkoutSpeechFormatter.format(
      workoutName: "Midweek Engine",
      estimatedDurationMinutes: 45,
      sections: sections,
      dayName: "today"
    )

    XCTAssertTrue(result.contains("Today's workout is Midweek Engine"))
    XCTAssertTrue(result.contains("Strength: Deadlift: 5 x 3"))
    XCTAssertTrue(result.contains("Metcon: 18-minute EMOM"))
    XCTAssertLessThanOrEqual(result.count, 500)
  }

  func testFallsBackToStructuredMovements() {
    let movement = FitboxPublicBlockMovement(
      id: "movement-1",
      position: 1,
      sets: 5,
      repsScheme: "3",
      weightKg: 100,
      durationSeconds: nil,
      distanceMeters: nil,
      calories: nil,
      movements: FitboxPublicMovementName(id: "deadlift", name: "Deadlift")
    )
    let section = FitboxPublicWorkoutSection(
      id: "strength",
      name: "Strength",
      position: 1,
      sectionMode: "workout",
      coachNotes: nil,
      sectionBlocks: [
        FitboxPublicSectionBlock(
          id: "block-1",
          position: 1,
          blockMovements: [movement]
        )
      ]
    )

    let result = FitboxWorkoutSpeechFormatter.format(
      workoutName: "Heavy Day",
      estimatedDurationMinutes: nil,
      sections: [section],
      dayName: "tomorrow"
    )

    XCTAssertTrue(result.contains("Tomorrow's workout is Heavy Day"))
    XCTAssertTrue(result.contains("Strength: 5 sets of 3 Deadlift at 100 kilograms"))
  }

  func testKeepsResponseWithinNaturalBoundaryLimit() {
    let section = FitboxPublicWorkoutSection(
      id: "long",
      name: "Conditioning",
      position: 1,
      sectionMode: "workout",
      coachNotes: String(repeating: "Long member-visible workout instruction ", count: 30),
      sectionBlocks: []
    )

    let result = FitboxWorkoutSpeechFormatter.format(
      workoutName: "Long Session",
      estimatedDurationMinutes: 60,
      sections: [section],
      dayName: "today"
    )

    XCTAssertLessThanOrEqual(result.count, 500)
    XCTAssertTrue(result.hasSuffix("."))
  }
}
