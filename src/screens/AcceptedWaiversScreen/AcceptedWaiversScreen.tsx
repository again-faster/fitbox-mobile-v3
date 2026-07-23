/* eslint-disable no-console */
import { Button, Text } from '@/components/atoms';
import { getAcceptedWaivers } from '@/services/waivers';
import { config as themeConfig } from '@/theme/_config';
import { memberTheme } from '@/theme/member';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
					path: `${PictureDir}/waiver.${ext as string}`,
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
			<View style={style.waiverCard}>
				<View style={style.waiverIcon}>
					<Icon
						name="file-check-outline"
						size={24}
						color={memberTheme.colors.primaryDeep}
					/>
				</View>
				<View style={style.waiverCopy}>
					<Text bold style={style.waiverTitle}>
						Accepted waiver
					</Text>
					<Text style={style.waiverDate}>
						{moment(item.created_at).format('DD MMMM YYYY')}
					</Text>
				</View>
				<Button
					title="View"
					compact
					style={style.viewButton}
					labelStyle={style.viewButtonLabel}
					onPress={() => void handleDownload(index)}
				/>
			</View>
		);
	};

	const renderHeader = () => (
		<View style={style.headerCard}>
			<View style={style.headerIcon}>
				<Icon
					name="shield-check-outline"
					size={26}
					color={memberTheme.colors.primaryDeep}
				/>
			</View>
			<View style={style.headerCopy}>
				<Text bold style={style.headerTitle}>
					Your accepted waivers
				</Text>
				<Text style={style.headerText}>
					Review the documents you have accepted at this gym.
				</Text>
			</View>
		</View>
	);

	const renderEmpty = () => (
		<View style={style.emptyCard}>
			<Icon
				name="file-document-outline"
				size={34}
				color={memberTheme.colors.textMuted}
			/>
			<Text bold style={style.emptyTitle}>
				No accepted waivers
			</Text>
			<Text center style={style.emptyText}>
				Accepted gym waivers will appear here.
			</Text>
		</View>
	);

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
			ListHeaderComponent={renderHeader}
			ListEmptyComponent={renderEmpty}
			onRefresh={handleRefresh}
		/>
	);
};

const style = StyleSheet.create({
	list: {
		flexGrow: 1,
		padding: memberTheme.spacing.lg,
		backgroundColor: memberTheme.colors.background,
	},
	loaderStyle: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.background,
	},
	headerCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.lg,
		flexDirection: 'row',
		marginBottom: memberTheme.spacing.lg,
		padding: memberTheme.spacing.lg,
	},
	headerIcon: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.md,
		height: 50,
		justifyContent: 'center',
		width: 50,
	},
	headerCopy: { flex: 1, marginLeft: memberTheme.spacing.md },
	headerTitle: { color: memberTheme.colors.ink, fontSize: 18 },
	headerText: {
		color: memberTheme.colors.textMuted,
		fontSize: 13,
		lineHeight: 18,
		marginTop: 4,
	},
	waiverCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.md,
		borderWidth: 1,
		flexDirection: 'row',
		marginBottom: memberTheme.spacing.sm,
		padding: memberTheme.spacing.md,
	},
	waiverIcon: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.sm,
		height: 46,
		justifyContent: 'center',
		width: 46,
	},
	waiverCopy: { flex: 1, marginLeft: memberTheme.spacing.md },
	waiverTitle: { color: memberTheme.colors.ink, fontSize: 15 },
	waiverDate: {
		color: memberTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 4,
	},
	viewButton: {
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.pill,
		minWidth: 68,
	},
	viewButtonLabel: {
		color: memberTheme.colors.primaryDeep,
		fontSize: 12,
		textTransform: 'none',
	},
	emptyCard: { alignItems: 'center', padding: memberTheme.spacing.xxl },
	emptyTitle: {
		color: memberTheme.colors.ink,
		fontSize: 16,
		marginTop: memberTheme.spacing.md,
	},
	emptyText: {
		color: memberTheme.colors.textMuted,
		fontSize: 13,
		marginTop: memberTheme.spacing.xs,
	},
});

export default AcceptedWaiversScreen;
