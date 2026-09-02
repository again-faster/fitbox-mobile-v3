import { useTheme } from '@/theme';
import type { TrainingStackParamList } from '@/types/navigation';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useWSAuth } from './hooks/useWSAuth';

type Nav = StackNavigationProp<TrainingStackParamList, 'TrainingRoot'>;

const TrainingRoot = () => {
	const { colors } = useTheme();
	const nav = useNavigation<Nav>();
	const { state } = useWSAuth();

	useEffect(() => {
		if (state.status === 'loading') return;

		if (state.status === 'authenticated') {
			const { persona } = state.session.user;
			if (persona === 'member' || persona === 'solo') {
				nav.replace('TrainingToday');
			} else {
				nav.replace('TrainingActivate', { errorCode: 'NO_MEMBERSHIP' });
			}
			return;
		}

		if (state.status === 'not_found') {
			nav.replace('TrainingActivate', {});
			return;
		}

		if (state.status === 'no_membership') {
			nav.replace('TrainingActivate', { errorCode: 'NO_MEMBERSHIP' });
			return;
		}

		if (state.status === 'unknown_gym') {
			nav.replace('TrainingActivate', { errorCode: 'UNKNOWN_GYM' });
			return;
		}

		if (state.status === 'provision_failed') {
			nav.replace('TrainingActivate', { errorCode: 'PROVISION_FAILED' });
			return;
		}

		nav.replace('TrainingActivate', { errorCode: 'NETWORK_ERROR' });
	}, [state, nav]);

	return (
		<View style={[styles.container, { backgroundColor: '#F9FAFB' }]}>
			<ActivityIndicator size="large" color={colors.brand} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default TrainingRoot;
