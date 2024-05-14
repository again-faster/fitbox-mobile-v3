/* eslint-disable no-console */
import { Button, Card, HR, Text } from '@/components/atoms';
import { getAcceptedWaivers } from '@/services/waivers';
import { config as themeConfig } from '@/theme/_config';
import { MenuStackNavigatorProps } from '@/types/navigation';
import { WaiverType } from '@/types/schemas/waivers';
import moment from 'moment';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Permission,
	PermissionsAndroid,
	Platform,
	StyleSheet,
	View,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import SimpleToast from 'react-native-simple-toast';

type StateProps = {
	list: WaiverType[];
	isLoading: boolean;
	isRefreshing: boolean;
};

const AcceptedWaiversScreen = ({ navigation }: MenuStackNavigatorProps) => {
	const [state, setState] = useState<StateProps>({
		list: [],
		isLoading: true,
		isRefreshing: false,
	});

	useEffect(() => {
		void getData();
	}, []);

	const getData = async () => {
		try {
			const res = await getAcceptedWaivers();

			setState({
				list: res.data,
				isLoading: false,
				isRefreshing: false,
			});
		} catch (e) {
			console.log('error: ', e);
		}
	};

	const handleRefresh = () => {
		setState({ ...state, isRefreshing: true });
		void getData();
	};

	const handleDownload = async (index: number) => {
		const prefixUrl = process.env.API_URL || '';
		const { list } = state;
		const waiver: WaiverType = list[index] as WaiverType;
		const waiverUrl = `${prefixUrl}/${waiver.file_path}`;

		navigation.push('PDFViewerScreen', {
			waiverUrl,
			title: 'Waiver',
		});

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

			const pathPieces = waiver.file_path.split('.');

			const ext = pathPieces[pathPieces.length - 1];

			const options = {
				fileCache: true,
				addAndroidDownloads: {
					useDownloadManager: true,
					notification: true,
					path: `${PictureDir}/waiver${ext as string}`,
				},
			};

			configFunction(options)
				.fetch('GET', waiverUrl)
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
	};

	const renderItem = ({
		item,
		index,
	}: {
		item: WaiverType;
		index: number;
	}) => {
		return (
			<Card>
				<Text>{moment(item.created_at).format('DD MMM YYYY')}</Text>
				<HR margin />
				<Button
					title="View Waiver"
					onPress={() => void handleDownload(index)}
				/>
			</Card>
		);
	};

	return state.isLoading ? (
		<View style={style.loaderStyle}>
			<ActivityIndicator size="large" color={themeConfig.colors.brand} />
		</View>
	) : (
		<FlatList
			data={state.list}
			renderItem={renderItem}
			refreshing={state.isRefreshing}
			contentContainerStyle={style.list}
			onRefresh={handleRefresh}
		/>
	);
};

const style = StyleSheet.create({
	list: {
		flex: 1,
		padding: themeConfig.metrics.rg,
		backgroundColor: themeConfig.backgrounds.gray,
	},
	loaderStyle: {
		flex: 1,
		justifyContent: 'center',
	},
});

export default AcceptedWaiversScreen;
