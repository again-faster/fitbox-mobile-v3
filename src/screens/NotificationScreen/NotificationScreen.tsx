import { Button, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { Constant, Say } from '@/utils';
import useStore from '@/zustand/Store';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { openSettings } from 'react-native-permissions';
import SimpleToast from 'react-native-simple-toast';

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
					style={{ marginBottom: config.metrics.md }}
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
			<Row spacing="space-between">
				<View style={layout.flex_1}>
					<Text size="md" bold>
						Configure Notifications
					</Text>
					{!state?.enabled && (
						<Text size="sm" color="darkgray">
							Notifications are currently turned off. Please
							enable your settings to start receiving important
							updates
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
			</Row>
			<Spacer size="lg" />

			{state?.enabled && renderOptions()}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: config.metrics.md,
	},
	enableButtonContainer: {
		marginLeft: config.metrics.xl,
	},
	enableButton: {
		alignSelf: 'flex-end',
	},
	optionSwitch: {
		marginLeft: config.metrics.xl,
	},
	optionsTextContainer: {
		flex: 4,
	},
});

export default NotificationScreen;
