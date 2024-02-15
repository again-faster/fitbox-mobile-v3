import { ComponentProps } from 'react';
import {
	Modal as RnModal,
	SafeAreaView,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { Card } from 'react-native-paper';

import { config } from '@/theme/_config';
import layout from '@/theme/layout';

const Modal = ({
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

				<Card style={styles.card}>{children}</Card>
			</SafeAreaView>
		</RnModal>
	);
};

export default Modal;

const styles = StyleSheet.create({
	card: {
		padding: config.metrics.md,
		width: '90%',
		alignSelf: 'center',
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
