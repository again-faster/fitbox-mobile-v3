import { Row, Spacer, Text } from '@/components/atoms';
import { goBack } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { Func, Say } from '@/utils';
import useStore from '@/zustand/Store';
import { useEffect, useRef, useState } from 'react';
import {
	Alert,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { Video as VideoCompressor } from 'react-native-compressor';
import { ProgressBar } from 'react-native-paper';
import {
	PERMISSIONS,
	RESULTS,
	requestMultiple,
} from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import {
	Camera as VideoCamera,
	useCameraDevice,
} from 'react-native-vision-camera';

type State = {
	source: string | null;
	countdown: number;
	previewPaused: boolean;
	processing: boolean;
	confirming: boolean;
	viewType: 'front' | 'back';
};

const MAX_DURATION = 10;

const Camera = () => {
	const [state, setState] = useState<State>({
		source: null,
		countdown: MAX_DURATION,
		previewPaused: true,
		processing: false,
		confirming: false,
		viewType: 'front',
	});

	const { setAppState } = useStore(store => ({
		setAppState: store.setAppState,
	}));

	const device = useCameraDevice(state.viewType);
	const camera = useRef<VideoCamera>(null);
	const [authorized, setAuthorized] = useState(false);
	const [isRecording, setIsRecording] = useState(false);

	useEffect(() => {
		const PERMISSION = [
			PERMISSIONS.ANDROID.CAMERA,
			PERMISSIONS.ANDROID.RECORD_AUDIO,
		];

		if (Platform.OS === 'android') {
			requestMultiple(PERMISSION)
				.then(results => {
					const cameraResult = results[PERMISSIONS.ANDROID.CAMERA];
					const audioResult =
						results[PERMISSIONS.ANDROID.RECORD_AUDIO];

					if (
						cameraResult === RESULTS.GRANTED &&
						audioResult === RESULTS.GRANTED
					) {
						setAuthorized(true);
					} else {
						if (cameraResult === RESULTS.UNAVAILABLE) {
							Say.warn(
								'Camera feature is not available on this device',
							);
						} else if (cameraResult !== RESULTS.GRANTED) {
							Say.warn(
								'Please allow camera permission to use this feature',
							);
						}

						if (audioResult === RESULTS.UNAVAILABLE) {
							Say.warn(
								'Audio feature is not available on this device',
							);
						} else if (audioResult !== RESULTS.GRANTED) {
							Say.warn(
								'Please allow microphone permission to use this feature',
							);
						}
					}
				})
				.catch(e => Say.err('Something went wrong: ', e as string));
		} else {
			setAuthorized(true);
		}
	}, []);

	const handleChangeViewType = () => {
		if (state.processing) return false;
		setState(prevState => ({
			...prevState,
			viewType: state.viewType === 'back' ? 'front' : 'back',
		}));
		return true;
	};

	useEffect(() => {
		if (isRecording) {
			const interval = setInterval(() => {
				setState(prevState => ({
					...prevState,
					countdown: prevState.countdown - 1,
				}));
			}, 1000);

			return () => clearInterval(interval);
		}
		return void true;
	}, [isRecording]);

	useEffect(() => {
		if (state.countdown === 0) {
			void handleStop();
		}
	}, [state.countdown]);

	const handleCapture = () => {
		if (state.processing) return false;

		if (authorized) {
			if (camera.current) {
				try {
					setState(prevState => ({
						...prevState,
						processing: true,
					}));
					camera.current.startRecording({
						onRecordingFinished(video) {
							setState(prevState => ({
								...prevState,
								source: video.path,
								processing: false,
							}));
						},
						onRecordingError(e) {
							Alert.alert('Recording Error: ', e.message);
						},
						fileType: 'mp4',
					});

					setIsRecording(true);
				} catch (e) {
					Alert.alert('Something went wrong: ', e as string);
				}
			}
		}

		return true;
	};

	const handleStop = async () => {
		if (camera.current) await camera.current.stopRecording();
		setState(prevState => ({ ...prevState, countdown: MAX_DURATION }));
		setIsRecording(false);
	};

	const handleRetake = () =>
		setState(prevState => ({ ...prevState, source: null }));

	const handleConfirm = async () => {
		if (state.confirming) return false;

		try {
			setState(prevState => ({ ...prevState, confirming: true }));
			const compressedVideo = await VideoCompressor.compress(
				state.source as string,
			);
			const base64 = (await Func.getBase64(compressedVideo)) as string;
			const data = `data:video/${Func.getFileExt(
				state.source as string,
			)};base64,${base64}`;

			setAppState('attachedFiles', [{ fileName: 'Video', base64: data }]);

			goBack();
		} catch (e) {
			Alert.alert('Error: ', e as string);
		}

		return setState(prevState => ({ ...prevState, confirming: false }));
	};
	return (
		<>
			<View style={styles.container}>
				{state.source && (
					<Video
						source={{ uri: state.source }}
						onError={() => Alert.alert('Preview Error')}
						controls
						style={styles.preview}
					/>
				)}
				{!state.source && device && (
					<VideoCamera
						device={device}
						isActive
						video
						audio
						ref={camera}
						style={styles.preview}
					/>
				)}
			</View>
			<View style={{ paddingVertical: config.metrics.md }}>
				{state.processing && (
					<View
						style={{
							...layout.flex_1,
							paddingHorizontal: config.metrics.xl,
						}}
					>
						<ProgressBar
							progress={state.countdown / MAX_DURATION}
							color={config.colors.brand}
						/>
					</View>
				)}
				<Spacer size="sm" />
				{!state.source && (
					<Row spacing="space-around">
						{!state.processing && (
							<View style={styles.recordStyle}>
								<TouchableOpacity onPress={handleCapture}>
									<Icon
										name="record"
										size={50}
										color={config.colors.brand}
									/>
								</TouchableOpacity>

								<Icon
									name="camera-flip-outline"
									size={config.metrics.xl}
									onPress={handleChangeViewType}
								/>
							</View>
						)}

						{state.processing && (
							<TouchableOpacity onPress={() => void handleStop()}>
								<Icon
									name="stop-circle"
									color={config.colors.danger}
									size={50}
								/>
							</TouchableOpacity>
						)}
					</Row>
				)}
				{state.source && (
					<Row spacing="space-around">
						<TouchableOpacity onPress={() => void handleRetake()}>
							<Text>Retake</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => void handleConfirm()}>
							<Text>Confirm</Text>
						</TouchableOpacity>
					</Row>
				)}
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		backgroundColor: 'black',
	},
	preview: {
		flex: 1,
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	recordStyle: {
		alignItems: 'center',
	},
});

export default Camera;
