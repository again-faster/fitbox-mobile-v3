export type WorkoutAssignment = {
	id: string;
	workout_id: string;
	due_date: string;
	notes: string | null;
	program_id?: string | null;
	day_number?: number | null;
	programs?: {
		name: string;
		total_days: number | null;
	} | null;
	workouts: {
		name: string;
		estimated_duration_minutes: number | null;
	};
};

export type WorkoutDetail = {
	id: string;
	name: string;
	estimated_duration_minutes: number | null;
	workout_sections: WorkoutSection[];
};

export type WorkoutSection = {
	id: string;
	name: string;
	position: number;
	section_blocks: SectionBlock[];
};

export type ScalingLevel = 'rx' | 'scaled' | 'foundations';

export type LeaderboardEntry = {
	athleteId: string;
	displayName: string;
	scoreDisplay: string;
	scoreValue: number | null;
	scalingLevel: ScalingLevel | null;
	loggedAt: string;
};

export type SectionBlock = {
	id: string;
	label: string | null;
	intent: string;
	position: number;
	rest_seconds: number | null;
	scaled_notes: string | null;
	foundations_notes: string | null;
	block_movements: BlockMovement[];
};

export type BlockMovement = {
	id: string;
	position: number;
	sets: number | null;
	reps_scheme: string | null;
	weight_kg: number | null;
	notes: string | null;
	movements: {
		id: string;
		name: string;
	};
};

export type AthleteRM = {
	id: string;
	movement_id: string;
	rep_max: number;
	weight_kg: number;
	achieved_on: string;
	source: string;
	notes: string | null;
	movements: {
		name: string;
	};
};

export type WellnessResponse = {
	id: string;
	recorded_for: string;
	user_id: string;
};

export type CoachNote = {
	id: string;
	content: string;
	created_at: string;
	read_at: string | null;
	section_id: string | null;
};

export type WorkoutResult = {
	id: string;
	workout_id: string;
	completed_at: string;
	total_volume_kg: number | null;
	duration_seconds: number | null;
	subjective_rating: string | null;
	workouts: {
		name: string;
	};
};

export type FeedItem = {
	id: string;
	athlete_id: string;
	completed_at: string;
	workouts: {
		name: string;
	};
	profile?: {
		full_name: string;
		avatar_url: string | null;
	};
};

export type Notification = {
	id: string;
	title: string;
	body: string;
	kind: 'assignment' | 'coach_note' | 'reaction' | 'wellness_followup';
	entity_id: string | null;
	link: string | null;
	read_at: string | null;
	created_at: string;
};

export type SetResult = {
	id: string;
	movement_result_id: string;
	set_number: number;
	reps: number | null;
	weight: number | null;
	rpe: number | null;
	notes: string | null;
	completed: boolean;
	idempotency_key: string;
};

export type WellnessDimension = {
	id: string;
	slug: string;
	label: string;
	higher_is_better: boolean;
	position: number;
};

export type PersonalWorkout = {
	id: string;
	name: string;
	description: string | null;
	est_duration_min: number | null;
	created_at: string;
};

export type WellnessTrend = {
	dimension: string;
	label: string;
	recent_avg: number | null;
	baseline_avg: number | null;
	higher_is_better: boolean;
};
