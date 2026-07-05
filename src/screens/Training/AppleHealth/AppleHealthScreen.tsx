import { authorize, syncNow } from '@/services/healthKit';
import {
	configureBgSync,
	stopBgSync,
} from '@/services/healthKit/backgroundSync';
import { mmkvStorage } from '@/storage';
import {
	ActivityIndicator,
	Platform,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';

const formatLastSynced = (iso: string | null): string => {
	if (!iso) return 'Never synced';
	const d = new Date(iso);
	return `Last synced: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
};

const AppleHealthScreen = () => {
	// All hooks must be called unconditionally (Rules of Hooks).
	// Platform guard is applied inside effects and handlers.
	const [isAuthorized, setIsAuthorized] = useState(
		Platform.OS === 'ios' &&
			mmkvStorage.getString('healthkit.authorized') === 'true',
	);
	const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
		mmkvStorage.getString('healthkit.lastSyncedAt') ?? null,
	);
	const [isSyncing, setIsSyncing] = useState(false);

	useEffect(() => {
		if (Platform.OS !== 'ios') return;
		if (mmkvStorage.getString('healthkit.authorized') === 'true') {
			void configureBgSync();
		}
	}, []);

	const handleToggle = useCallback(async (value: boolean) => {
		if (value) {
			const granted = await authorize();
			if (granted) {
				mmkvStorage.set('healthkit.authorized', 'true');
				await configureBgSync();
				setIsAuthorized(true);
			}
		} else {
			stopBgSync();
			mmkvStorage.set('healthkit.authorized', 'false');
			setIsAuthorized(false);
		}
	}, []);

	const handleSyncNow = useCallback(async () => {
		setIsSyncing(true);
		try {
			await syncNow();
			setLastSyncedAt(
				mmkvStorage.getString('healthkit.lastSyncedAt') ?? null,
			);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error('[AppleHealth] manual sync error', e);
		} finally {
			setIsSyncing(false);
		}
	}, []);

	if (Platform.OS !== 'ios') {
		return (
			<View style={styles.container}>
				<Text style={styles.unavailable}>
					HealthKit is only available on iOS.
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Connect toggle */}
			<View style={styles.row}>
				<Text style={styles.label}>Connect Apple Health</Text>
				<Switch
					value={isAuthorized}
					onValueChange={value => {
						void handleToggle(value);
					}}
					trackColor={{ true: '#3B82F6', false: '#6B7280' }}
				/>
			</View>

			{/* Status and sync controls — shown only when authorized */}
			{isAuthorized ? (
				<>
					<Text style={styles.lastSynced}>
						{formatLastSynced(lastSyncedAt)}
					</Text>

					{isSyncing ? (
						<ActivityIndicator
							size="small"
							color="#3B82F6"
							style={styles.indicator}
						/>
					) : (
						<TouchableOpacity
							style={styles.syncButton}
							onPress={() => {
								void handleSyncNow();
							}}
						>
							<Text style={styles.syncButtonText}>Sync Now</Text>
						</TouchableOpacity>
					)}
				</>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9FAFB',
		padding: 16,
		gap: 12,
	},
	unavailable: {
		fontSize: 15,
		color: '#6B7280',
		textAlign: 'center',
		marginTop: 40,
	},
	row: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	label: {
		fontSize: 16,
		color: '#111827',
	},
	lastSynced: {
		fontSize: 13,
		color: '#6B7280',
		paddingHorizontal: 4,
	},
	indicator: {
		alignSelf: 'center',
		marginTop: 8,
	},
	syncButton: {
		backgroundColor: '#3B82F6',
		borderRadius: 12,
		padding: 14,
		alignItems: 'center',
	},
	syncButtonText: {
		color: '#FFFFFF',
		fontSize: 15,
		fontWeight: '600',
	},
});

export default AppleHealthScreen;
