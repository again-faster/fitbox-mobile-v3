import { Row, ScrollView, Text } from '@/components/atoms';
import { BottomPanel } from '@/components/molecules';
import { config } from '@/theme/_config';
import { ModalEnum } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import { ClassFilter, VenueFilter } from '@/zustand/interface/SessionInterface';
import { produce } from 'immer';
import { memo, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FilterTypeEnum } from './CalendarFilterPanel';

const { fonts, metrics } = config;

interface CalendarFilterSelectProps {
	type: FilterTypeEnum;
}

const CalendarFilterSelect = ({ type }: CalendarFilterSelectProps) => {
	// prepare the title based on the type
	const title =
		type === FilterTypeEnum.CLASS
			? 'Select Class Filters'
			: 'Select Location Filters';

	// the modal is either CLASS_FILTER or VENUE_FILTER
	const modal =
		type === FilterTypeEnum.CLASS
			? ModalEnum.CLASS_FILTER
			: ModalEnum.VENUE_FILTER;

	// prepare filter state based on the type
	const stateFilterToApply =
		type === FilterTypeEnum.CLASS
			? 'classFiltersToApply'
			: 'venueFiltersToApply';

	const {
		visible,
		toggleModal,
		filtersToApply,
		setClassFiltersToApply,
		setVenueFiltersToApply,
		venueFilters,
		classFilters,
	} = useStore(state => {
		return {
			visible: !!state[modal],
			venueFilters: state.venueFilters,
			classFilters: state.classFilters,
			filtersToApply: state[stateFilterToApply],
			toggleModal: state.toggleModal,

			setClassFiltersToApply: state.setClassFiltersToApply,
			setVenueFiltersToApply: state.setVenueFiltersToApply,
		};
	});

	useEffect(() => {
		if (visible) {
			// set the default filters to apply
			if (type === FilterTypeEnum.CLASS) {
				setClassFiltersToApply(classFilters);
			} else {
				setVenueFiltersToApply(venueFilters);
			}
		}
	}, [visible]);

	const handleFilterPress = (index: number) => {
		// new filter data
		const newFilters = produce(filtersToApply, draft => {
			draft[index] = {
				...filtersToApply[index],
				is_selected: !filtersToApply[index]?.is_selected,
			} as ClassFilter | VenueFilter;
		});

		if (type === FilterTypeEnum.CLASS) {
			setClassFiltersToApply(newFilters as ClassFilter[]);
		} else {
			setVenueFiltersToApply(newFilters as VenueFilter[]);
		}
	};

	return (
		<BottomPanel
			title={title}
			visible={visible}
			onClose={() => {
				toggleModal(modal, false);
				setClassFiltersToApply(classFilters);
				setVenueFiltersToApply(venueFilters);
			}}
			rightTitle={
				<TouchableOpacity
					onPress={() => {
						toggleModal(modal, false);
						toggleModal(ModalEnum.CALENDAR_FILTER, true);
					}}
				>
					<Text color="info" size="md">
						Accept
					</Text>
				</TouchableOpacity>
			}
		>
			<ScrollView>
				{filtersToApply.map((data, key) => (
					<TouchableOpacity
						key={key}
						onPress={() => {
							handleFilterPress(key);
						}}
						style={{
							paddingVertical: metrics.md,
							paddingHorizontal: metrics.lg,
						}}
					>
						<Row spacing="space-between">
							<Text size="md">{data.name}</Text>

							{data?.is_selected && (
								<Icon
									name="check"
									size={fonts.metrics.md}
									color={fonts.colors.info}
								/>
							)}
						</Row>
					</TouchableOpacity>
				))}
			</ScrollView>
		</BottomPanel>
	);
};

export default memo(CalendarFilterSelect);
