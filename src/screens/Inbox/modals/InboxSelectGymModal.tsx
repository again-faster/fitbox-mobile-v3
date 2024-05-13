import { FlatList } from '@/components/molecules';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { Gym } from '@/types/schemas/gym';
import { StyleSheet, View } from 'react-native';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import GymItem from '../components/GymItem';

const { fonts } = config;

interface InboxSelectGymModalProps {
	visible: boolean;
	gyms: Gym[];
	onSelect: (gym: Gym) => void;
}

const InboxSelectGymModal = ({
	visible,
	gyms,
	onSelect,
}: InboxSelectGymModalProps) => {
	return (
		<View
			// eslint-disable-next-line react-native/no-inline-styles
			style={[styles.container, { display: visible ? 'flex' : 'none' }]}
		>
			<FlatList
				style={layout.flex_1}
				data={gyms}
				renderItem={({ item, index }) => {
					const isFirstItem = index === 0;

					return (
						<GymItem
							gym={item as Gym}
							onPress={() => onSelect(item as Gym)}
							right={
								isFirstItem ? (
									<MIcon
										name="chevron-up"
										size={fonts.metrics.xl}
										color={fonts.colors.info}
									/>
								) : (
									<MIcon
										name="check"
										size={fonts.metrics.xl}
										color={fonts.colors.lightgrey}
									/>
								)
							}
						/>
					);
				}}
			/>
		</View>
	);
};

export default InboxSelectGymModal;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		height: '100%',
		width: '100%',
		position: 'absolute',
		backgroundColor: 'white',
		zIndex: 2,
	},
});
