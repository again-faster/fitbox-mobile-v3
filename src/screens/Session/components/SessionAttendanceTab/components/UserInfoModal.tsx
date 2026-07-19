import { ComponentProps } from 'react';
import {
	Modal as RnModal,
	SafeAreaView,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';

import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';

const UserInfoModal = ({
	onDismiss,
	transparent = true,
	animationType = 'fade',
	children,
	...rest
}: ComponentProps<typeof RnModal>) => {
	return (
		<RnModal
			{...rest}
			transparent={transparent}
			animationType={animationType}
		>
			<SafeAreaView style={styles.safeArea}>
				<TouchableOpacity onPress={onDismiss} style={styles.backDrop}>
					<View style={layout.flex_1} />
				</TouchableOpacity>

				<View style={styles.card}>{children}</View>
			</SafeAreaView>
		</RnModal>
	);
};

export default UserInfoModal;

const styles = StyleSheet.create({
	card: {
		width: '90%',
		alignSelf: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.lg,
		padding: memberTheme.spacing.lg,
		marginVertical: config.metrics.xs,
		borderColor: memberTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		...memberTheme.shadow,
		marginTop: 120,
	},
	safeArea: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
	},
	backDrop: {
		flex: 1,
		width: '100%',
		height: '100%',
		position: 'absolute',
	},
});
