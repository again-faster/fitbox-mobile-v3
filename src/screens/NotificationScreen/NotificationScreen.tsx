import { Button, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { Constant, Say } from '@/utils';
import useStore from '@/zustand/Store';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { openSettings } from 'react-native-permissions';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type State = {
	enabled: boolean;
	settings: { [key: string]: boolean };
};
const NotificationScreen = () => {
	const { notifSettings, setAppState } = useStore(state => ({
		notifSettings: state.notifSettings,
		setAppState: state.setAppState,
	}));
	const [state, setState] = useState<State>();

	useEffect(() => {
		const currentSettings = notifSettings;
		const settings = Object.keys(Constant.NOTIFICATION_SETTINGS).reduce(
			(setting, key) => {
				const settingKey =
					key as keyof typeof Constant.NOTIFICATION_SETTINGS;
				return {
					...setting,
					[settingKey]:
						currentSettings?.settings?.[settingKey] ??
						Constant.NOTIFICATION_SETTINGS[settingKey]
							?.defaultValue,
				};
			},
			{},
		);

		setState({
			enabled: false,
			settings,
		});

		refreshStates();
	}, []);

	const requestNotificationPermission = () => {
		openSettings().catch(() => {
			SimpleToast.show(
				'Unable to open settings, please enable notifications manually.',
				SimpleToast.SHORT,
			);
		});
	};

	const refreshStates = () => {
		if (notifSettings) {
			const newSettings = notifSettings;

			setState({ ...newSettings });
		}
	};

	useEffect(() => {
		if (!isEqual(state, notifSettings)) refreshStates();
	}, [notifSettings]);

	const handleOnToggle = (setting: string, value: boolean) => {
		const currentSettings = notifSettings;

		const newSetting = {
			...currentSettings,
			settings: {
				...currentSettings.settings,
				[setting]: value,
			},
		};

		setAppState('notifSettings', newSetting);
	};

	const renderOptions = () => {
		const { enabled, settings } = state as State;

		return Object.entries(settings).map(([key, setting]) => {
			const disabled =
				Constant.NOTIFICATION_SETTINGS[key]?.disabled || !enabled;
			const onPress = () =>
				!disabled
					? handleOnToggle(key, !setting)
					: Say.err(
							'Unable to change this setting as of the moment',
							'Sorry',
						);
			return (
				<Row
					key={key}
					spacing="space-between"
					onPress={onPress}
					style={styles.optionCard}
				>
					<View style={styles.optionsTextContainer}>
						<Text
							color={disabled ? 'lightgrey' : 'black'}
							size="md"
							bold
						>
							{Constant.NOTIFICATION_SETTINGS[key]?.title}
						</Text>
						<Text
							color={disabled ? 'lightgrey' : 'black'}
							size="sm"
						>
							{Constant.NOTIFICATION_SETTINGS[key]?.description}
						</Text>
					</View>

					<Switch
						color={config.colors.brand}
						value={setting}
						onValueChange={onPress}
						disabled={disabled}
						style={styles.optionSwitch}
					/>
				</Row>
			);
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.headerCard}>
				<View style={styles.headerIcon}>
					<Icon
						name="bell-outline"
						size={26}
						color={memberTheme.colors.primaryDeep}
					/>
				</View>
				<View style={layout.flex_1}>
					<Text bold style={styles.headerTitle}>
						Stay in the loop
					</Text>
					{!state?.enabled && (
						<Text size="sm" style={styles.headerText}>
							Notifications are currently turned off. Please
							enable them to receive important gym updates.
						</Text>
					)}
					{state?.enabled && (
						<Text size="sm" style={styles.headerText}>
							Choose which updates you want to receive.
						</Text>
					)}
				</View>
				{!state?.enabled && (
					<View style={styles.enableButtonContainer}>
						<Button
							onPress={requestNotificationPermission}
							style={styles.enableButton}
							mode="contained"
							title="Turn on"
						/>
					</View>
				)}
			</View>
			<Spacer size="lg" />

			{state?.enabled && renderOptions()}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
		padding: memberTheme.spacing.lg,
	},
	headerCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.lg,
		flexDirection: 'row',
		padding: memberTheme.spacing.lg,
	},
	headerIcon: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.md,
		height: 50,
		justifyContent: 'center',
		marginRight: memberTheme.spacing.md,
		width: 50,
	},
	headerTitle: { color: memberTheme.colors.ink, fontSize: 18 },
	headerText: {
		color: memberTheme.colors.textMuted,
		lineHeight: 18,
		marginTop: 4,
	},
	enableButtonContainer: {
		marginLeft: config.metrics.xl,
	},
	enableButton: {
		alignSelf: 'flex-end',
		backgroundColor: memberTheme.colors.primaryDeep,
		borderRadius: memberTheme.radius.pill,
	},
	optionSwitch: {
		marginLeft: config.metrics.xl,
	},
	optionsTextContainer: {
		flex: 4,
	},
	optionCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.md,
		borderWidth: 1,
		marginBottom: memberTheme.spacing.sm,
		padding: memberTheme.spacing.md,
	},
});

export default NotificationScreen;
