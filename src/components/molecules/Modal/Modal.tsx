import { ComponentProps } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Portal, Modal as RnModal } from 'react-native-paper';

import { config } from '@/theme/_config';
import layout from '@/theme/layout';

const Modal = ({
	children,
	visible,
	onDismiss,
	...rest
}: ComponentProps<typeof RnModal>) => {
	return (
		<Portal>
			<RnModal
				visible={visible}
				dismissable={false}
				contentContainerStyle={layout.fullHeight}
				{...rest}
			>
				<TouchableOpacity onPress={onDismiss} style={styles.backDrop}>
					<View style={layout.flex_1} />
				</TouchableOpacity>
				{children}
			</RnModal>
		</Portal>
	);
};

export default Modal;

const styles = StyleSheet.create({
	card: {
		backgroundColor: 'white',
		borderRadius: config.metrics.md,
		padding: config.metrics.md,
		width: '90%',
		alignSelf: 'center',
	},
	safeArea: {
		justifyContent: 'center',
	},
	backDrop: {
		flex: 1,
		width: '100%',
		height: '100%',
		position: 'absolute',
	},
});
