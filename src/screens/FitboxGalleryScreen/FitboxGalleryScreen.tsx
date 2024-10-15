// OBSOLETE: hide fitbox gallery feature
import { Card, Row, Spacer, Text } from '@/components/atoms';
import { getFitboxGallery } from '@/services/message';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ComposeScreenProps } from '@/types/navigation';
import { FitboxGalleryFilesType } from '@/types/schemas/message';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type State = {
	list: FitboxGalleryFilesType[];
	loading: boolean;
};

const FitboxGalleryScreen = ({ navigation }: ComposeScreenProps) => {
	const [state, setState] = useState<State>({ list: [], loading: true });
	const { setAppState } = useStore(store => ({
		setAppState: store.setAppState,
	}));

	useEffect(() => {
		void getData();
	}, []);

	const getData = async () => {
		let list: FitboxGalleryFilesType[] = [];

		try {
			list = (await getFitboxGallery()).data.files;
		} catch (e) {
			Say.err(e as ICatchError);
		}

		setState({ list, loading: false });
	};

	const handleSelect = (item: FitboxGalleryFilesType) => {
		setAppState('attachedFiles', [
			{
				from: 'fitbox_gallery',
				fileName: item.name,
				url: item.public_url,
			},
		]);
		navigation.pop();
	};

	const renderItem = ({
		item,
		index,
	}: {
		item: FitboxGalleryFilesType;
		index: number;
	}) => {
		const getIcon = (type: string) => {
			switch (type) {
				case 'image':
					return 'image';
				case 'video':
					return 'logo-youtube';
				case 'pdf':
					return 'document';
				default:
					return 'document';
			}
		};

		return (
			<Card
				key={index}
				style={styles.cardContainer}
				onPress={() => handleSelect(item)}
			>
				<Row align="center">
					<Ionicons
						name={getIcon(item.type)}
						size={config.metrics.md}
						color={config.backgrounds.darkgray}
					/>
					<Spacer horizontal size="sm" />
					<Text style={layout.flex_1}>{item.name}</Text>
				</Row>
			</Card>
		);
	};

	return state.loading ? (
		<View style={styles.loader}>
			<ActivityIndicator size="large" />
		</View>
	) : (
		<FlatList
			data={state.list}
			renderItem={renderItem}
			style={{
				padding: config.metrics.md,
			}}
		/>
	);
};

const styles = StyleSheet.create({
	cardContainer: {
		borderRadius: 2,
		shadowOpacity: 0,
		borderColor: config.borders.colors.lightgrey,
		borderWidth: StyleSheet.hairlineWidth,
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
	},
});

export default FitboxGalleryScreen;
