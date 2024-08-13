import { Text } from '@/components/atoms';
import { Constant } from '@/utils';
import { useIsFocused } from '@react-navigation/native';
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
	Camera,
	CameraDevice,
	CameraRuntimeError,
	useCameraDevice,
	useCodeScanner,
} from 'react-native-vision-camera';

const QRCamera = ({
	visible,
	onDismiss,
	onFinish,
}: {
	visible: boolean;
	onDismiss: () => void;
	onFinish: (code: unknown) => void;
}) => {
	const device = useCameraDevice('back');
	const isFocused = useIsFocused();
	const overlayOpacity = 'rgba(250,250,250,.5)';

	const codeScanner = useCodeScanner({
		codeTypes: ['qr', 'ean-13'],
		onCodeScanned: codes => {
			if (codes.length > 0) {
				if (codes[0]?.value) {
					setTimeout(() => onFinish(codes[0]?.value), 500);
				}
			}
		},
	});

	const onError = (error: CameraRuntimeError) => {
		Alert.alert('Camera Error', error.message);
	};

	return (
		<Modal animationType="fade" visible={visible}>
			<Camera
				style={styles.cameraStyle}
				onError={onError}
				device={device as CameraDevice}
				isActive={isFocused}
				codeScanner={codeScanner}
				photo={false}
			/>
			<View style={styles.overlayStyle}>
				<Icon
					name="crop-free"
					size={Constant.DEVICEWIDTH / 1.5}
					color={overlayOpacity}
				/>
				{onDismiss && (
					<TouchableOpacity onPress={onDismiss}>
						<Text size="lg" style={{ color: overlayOpacity }}>
							Cancel
						</Text>
					</TouchableOpacity>
				)}
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	cameraStyle: {
		flex: 1,
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	overlayStyle: {
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		height: '100%',
		width: '100%',
	},
});

export default QRCamera;
