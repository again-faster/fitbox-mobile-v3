import HeaderButtonGroup from '@/components/template/Header/HeaderButtonGroup';
import useStore from '@/zustand/Store';
import { ModalEnum } from '@/zustand/interface/ModalInterface';
import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CalendarHeaderRightComponent = () => {
	const { toggleModal, classFilters, venueFilters } = useStore(state => ({
		classFilters: state.classFilters,
		venueFilters: state.venueFilters,
		toggleModal: state.toggleModal,
	}));

	const numberOfFilters = useMemo(() => {
		const numOfClassFilters = classFilters.filter(
			e => e.is_selected,
		).length;
		const numOfVenueFilters = venueFilters.filter(
			e => e.is_selected,
		).length;

		return numOfClassFilters + numOfVenueFilters;
	}, [classFilters, venueFilters]);

	return (
		<HeaderButtonGroup>
			<TouchableOpacity
				onPress={() => toggleModal(ModalEnum.CALENDAR_FILTER)}
				activeOpacity={0.7}
			>
				<Icon name="filter-outline" size={25} color="white" />
				<Badge
					visible={numberOfFilters > 0}
					style={styles.badgeStyle}
					size={16}
					allowFontScaling={false}
				>
					{numberOfFilters}
				</Badge>
			</TouchableOpacity>
		</HeaderButtonGroup>
	);
};

const styles = StyleSheet.create({
	badgeStyle: {
		position: 'absolute',
		top: -7,
	},
});

export default CalendarHeaderRightComponent;
