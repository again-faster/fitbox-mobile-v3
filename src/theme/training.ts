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
		onPrimary: memberTheme.colors.surface,
		info: memberTheme.colors.info,
		infoSoft: memberTheme.colors.infoSoft,
		success: memberTheme.colors.success,
		successSoft: memberTheme.colors.successSoft,
		warning: memberTheme.colors.warning,
		warningSoft: memberTheme.colors.warningSoft,
		danger: memberTheme.colors.danger,
		dangerSoft: memberTheme.colors.dangerSoft,
		disabled: memberTheme.colors.disabled,
		disabledSoft: memberTheme.colors.disabledSoft,
	},
	spacing: memberTheme.spacing,
	radius: memberTheme.radius,
	shadow: memberTheme.shadow,
	typography: memberTheme.typography,
	controls: memberTheme.controls,
	surfaces: memberTheme.surfaces,
	touchTarget: memberTheme.controls.minTouchTarget,
} as const;

export type TrainingTheme = typeof trainingTheme;
