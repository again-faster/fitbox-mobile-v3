/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import useAuth from '@/auth/hooks/useAuth';
import { Button, Row, Spacer, Text } from '@/components/atoms';
import { acceptWaiver, getWaiver } from '@/services/waivers';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationScreenProps } from '@/types/navigation';
import { UserSchemaType } from '@/types/schemas/user';
import * as Sentry from '@sentry/react-native';
import { isEmpty } from 'lodash';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	NativeSyntheticEvent,
	Permission,
	PermissionsAndroid,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/FontAwesome5';
import WebView, { WebViewNavigation } from 'react-native-webview';

type StateTypes = {
	loading: boolean;
	accepting: boolean;
	downloading: boolean;
};

const GymWaiverScreen = ({ navigation }: ApplicationScreenProps) => {
	const { signOut, user, updateUser } = useAuth();
	const [state, setState] = useState<StateTypes>({
		loading: true,
		accepting: false,
		downloading: false,
	});

	const [refreshCount, setRefreshCount] = useState(0);

	const [isLoading, setIsLoading] = useState(true);
	const waiverRef = useRef<string>('');
	const webViewRef = useRef<WebView>(null);

	const generateWebKey = () => {
		const key = Math.random() * 1000000;
		return key.toString(10);
	};
	const [webKey, setWebKey] = useState(generateWebKey());

	useEffect(() => {
		void (async () => {
			try {
				const res = await getWaiver();
				if (!res.error && res.url && res.url !== '') {
					waiverRef.current = res.url;
					setState(prevState => ({ ...prevState, loading: false }));
				}
			} catch (e) {
				waiverRef.current = '';
				setState(prevState => ({ ...prevState, loading: false }));
				setIsLoading(false);
			}
		})();
	}, []);

	const renderDownloadPDF = () => (
		<View
			style={{
				padding: config.metrics.rg,
				marginRight: config.metrics.rg,
			}}
		>
			<TouchableOpacity onPress={() => void handleDownload()}>
				<Icon
					name="download"
					size={18}
					color={config.backgrounds.lightgrey}
				/>
			</TouchableOpacity>
		</View>
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight:
				Platform.OS === 'android' ? renderDownloadPDF : () => null,
		});
	}, []);

	const handleDownload = async () => {
		const waiverUrl = waiverRef.current;
		if (!waiverUrl || waiverUrl === '') {
			Alert.alert('No waiver to download');
			return false;
		}

		// navigation.navigate('PDFViewer', {
		// 	title: 'Gym Waiver',
		// 	waiverUrl: state.waiver,
		// });

		if (Platform.OS === 'android') {
			const granted = await PermissionsAndroid.check(
				PermissionsAndroid.PERMISSIONS
					.WRITE_EXTERNAL_STORAGE as Permission,
			);
			if (!granted) {
				await PermissionsAndroid.request(
					PermissionsAndroid.PERMISSIONS
						.WRITE_EXTERNAL_STORAGE as Permission,
				);
			}

			const { fs } = ReactNativeBlobUtil;
			const configFunction =
				ReactNativeBlobUtil.config.bind(ReactNativeBlobUtil);
			const PictureDir =
				Platform.OS !== 'android'
					? fs.dirs.DocumentDir
					: fs.dirs.PictureDir;

			const pathPieces = waiverRef.current.split('.');

			const ext = pathPieces[pathPieces.length - 1];

			const options = {
				fileCache: true,
				addAndroidDownloads: {
					useDownloadManager: true,
					notification: true,
					path: `${PictureDir}/fitbox-waiver.${ext as string}`,
				},
			};

			configFunction(options)
				.fetch('GET', waiverRef.current)
				.then(() => {
					SimpleToast.show(
						'Waiver downloaded successfully',
						SimpleToast.SHORT,
					);
				})
				.catch(() => {
					SimpleToast.show(
						'There was an issue downloading the waiver',
						SimpleToast.SHORT,
					);
				});
		}

		return true;
	};

	const handleDecline = () => {
		signOut();
		navigation.reset({
			index: 0,
			routes: [{ name: 'Landing' }],
		});
	};

	const handleAccept = async () => {
		try {
			if (state.accepting) return false;

			setState({ ...state, accepting: true });

			await acceptWaiver();
			const session = user?.user_data as UserSchemaType;

			session.waiver_accepted = true;
			updateUser(session);
			navigation.navigate('Startup');

			return setState({ ...state, accepting: false });
		} catch (e) {
			setState({ ...state, accepting: false });
			return Alert.alert('Something went wrong');
		}
	};

	const handleContinue = () => {
		const session = user?.user_data as UserSchemaType;

		session.waiver_accepted = true;
		updateUser(session);
		navigation.navigate('Startup');
	};

	const handleLoadEnd = (data: NativeSyntheticEvent<WebViewNavigation>) => {
		setIsLoading(false);
		const { nativeEvent } = data;
		const { title }: { title: string } = nativeEvent;

		if (!title.trim()) {
			webViewRef.current?.stopLoading();
			webViewRef.current?.reload();
			setWebKey(generateWebKey());
			setRefreshCount(prevCount => prevCount + 1);
		} else {
			Sentry.captureMessage(
				`PDF loaded successfully after: ${refreshCount + 1} refreshes`,
			);
		}
	};

	return state.loading ? (
		<View style={styles.loader}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<View style={styles.container}>
			{isLoading && (
				<View style={styles.loader}>
					<ActivityIndicator
						size="large"
						color={config.colors.brand}
					/>
				</View>
			)}
			<View style={layout.flex_1}>
				{!isEmpty(waiverRef.current) ? (
					<WebView
						ref={webViewRef}
						key={webKey}
						style={layout.flex_1}
						source={{
							uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
								waiverRef.current,
							)}`,
						}}
						onLoadStart={() => setIsLoading(true)}
						onLoadEnd={handleLoadEnd}
					/>
				) : (
					<View style={[layout.flex_1, layout.justifyCenter]}>
						<Text center>No waiver found</Text>
					</View>
				)}
			</View>
			<Spacer size="lg" />

			<View style={styles.footer}>
				{!isEmpty(waiverRef.current) ? (
					<Row spacing="center">
						<View style={layout.flex_1}>
							<Button
								title="Decline"
								style={{
									backgroundColor: config.colors.danger,
								}}
								onPress={handleDecline}
							/>
						</View>
						<Spacer horizontal />
						<View style={layout.flex_1}>
							<Button
								title="Accept"
								style={{
									backgroundColor: config.colors.success,
								}}
								onPress={() => void handleAccept()}
								loading={state.accepting}
							/>
						</View>
					</Row>
				) : (
					<Button
						title="Continue"
						style={{ backgroundColor: config.colors.info }}
						onPress={() => void handleContinue()}
						loading={state.accepting}
					/>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		paddingVertical: config.metrics.xl,
		paddingHorizontal: config.metrics.lg,
	},
	headline: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
	footer: {
		justifyContent: 'flex-end',
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
	},
	pdfStyle: {
		width: '100%',
		height: '100%',
		backgroundColor: 'white',
	},
	errorPdf: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
});

export default GymWaiverScreen;
