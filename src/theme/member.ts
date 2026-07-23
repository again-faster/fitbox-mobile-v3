export const memberTheme = {
	colors: {
		background: '#F8F8FC',
		surface: '#FFFFFF',
		surfaceSoft: '#F1F0FF',
		primary: '#7775E6',
		primaryDeep: '#5F2260',
		primaryInk: '#44427D',
		ink: '#15151A',
		text: '#27272E',
		textMuted: '#6F707A',
		border: '#E8E7EF',
		success: '#43A047',
		warning: '#FFB300',
		danger: '#F44336',
	},
	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 24,
		xxl: 32,
	},
	radius: {
		sm: 12,
		md: 18,
		lg: 24,
		xl: 30,
		pill: 999,
	},
	shadow: {
		shadowColor: '#252236',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.08,
		shadowRadius: 18,
		elevation: 3,
	},
} as const;

export type MemberTheme = typeof memberTheme;
