import { memberTheme } from './member';

export const trainingTheme = {
	colors: {
		background: memberTheme.colors.background,
		surface: memberTheme.colors.surface,
		surfaceMuted: memberTheme.colors.surfaceSoft,
		text: memberTheme.colors.text,
		textMuted: memberTheme.colors.textMuted,
		border: memberTheme.colors.border,
		primary: memberTheme.colors.primary,
		primarySoft: memberTheme.colors.surfaceSoft,
		success: memberTheme.colors.success,
		successSoft: '#EAF7EC',
		warning: memberTheme.colors.warning,
		warningSoft: '#FFF4DA',
		danger: memberTheme.colors.danger,
	},
	spacing: memberTheme.spacing,
	radius: {
		sm: memberTheme.radius.sm,
		md: memberTheme.radius.md,
		lg: memberTheme.radius.lg,
		pill: memberTheme.radius.pill,
	},
	shadow: memberTheme.shadow,
	touchTarget: 44,
} as const;

export type TrainingTheme = typeof trainingTheme;
