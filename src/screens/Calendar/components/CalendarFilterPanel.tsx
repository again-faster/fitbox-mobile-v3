import { Button, Row, Spacer, Text } from '@/components/atoms';
import { BottomPanel } from '@/components/molecules';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { GymClassType } from '@/types/schemas/gym';
import { FilterTypeEnum, ModalEnum } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import { ClassFilter } from '@/zustand/interface/SessionInterface';
import { capitalize } from 'lodash';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { fonts } = config;

const CalendarFilterPanel = () => {
	const {
		visible,
		classFilters,
		venueFilters,
		onClose,
		onReset,
		toggleModal,
		clearFilter,
		venueFiltersToApply,
		classFiltersToApply,
		setClassFilters,
		setVenueFilters,
		setClassFiltersToApply,
		setVenueFiltersToApply,
	} = useStore(state => ({
		onClose: () => state.toggleModal(ModalEnum.CALENDAR_FILTER, false),
		visible: state[ModalEnum.CALENDAR_FILTER],
		toggleModal: state.toggleModal,
		onReset: () => state.clearFilters(),
		clearFilter: state.clearFilters,
		classFilters: state.classFilters,
		venueFilters: state.venueFilters,
		classFiltersToApply: state.classFiltersToApply,
		venueFiltersToApply: state.venueFiltersToApply,
		setClassFilters: state.setClassFilters,
		setVenueFilters: state.setVenueFilters,
		setClassFiltersToApply: state.setClassFiltersToApply,
		setVenueFiltersToApply: state.setVenueFiltersToApply,
	}));

	const getFilterTitle = (filterType: FilterTypeEnum) =>
		capitalize(filterType === FilterTypeEnum.VENUE ? 'Location' : 'Class');

	const renderFilterOptions = (filterType: FilterTypeEnum) => {
		const iconName =
			filterType === FilterTypeEnum.VENUE
				? 'map-marker-outline'
				: 'calendar-month-outline';
		const optionTitle = getFilterTitle(filterType);

		const filters: ClassFilter[] = (
			filterType === FilterTypeEnum.VENUE
				? venueFiltersToApply
				: classFiltersToApply
		).filter((item: GymClassType) => item.is_selected);

		const renderFilters =
			filters.length > 0
				? filters.map(
						(c, cIndex) =>
							c.name +
							(cIndex !== filters.length - 1 ? ', ' : ''),
					)
				: 'All';

		const renderClearIcon = filters.length > 0 && (
			<Icon
				name="close"
				size={fonts.metrics.xl}
				color={memberTheme.colors.textMuted}
				onPress={() => clearFilter(filterType)}
			/>
		);

		return (
			<TouchableOpacity
				onPress={() => {
					const useModal =
						filterType === FilterTypeEnum.VENUE
							? ModalEnum.VENUE_FILTER
							: ModalEnum.CLASS_FILTER;
					onClose();
					toggleModal(useModal);
				}}
			>
				<Row align="center" style={styles.optionRow}>
					<Icon
						name={iconName}
						size={fonts.metrics.xl}
						color={memberTheme.colors.primary}
					/>
					<Spacer horizontal size="rg" />
					<View style={layout.flex_1}>
						<Text
							size="md"
							transform="capitalize"
							style={styles.optionTitle}
						>
							{optionTitle}
						</Text>
						<Text
							size="sm"
							style={{
								color: filters.length
									? memberTheme.colors.primary
									: memberTheme.colors.textMuted,
							}}
						>
							{renderFilters}
						</Text>
					</View>
					<Spacer horizontal size="rg" />
					{renderClearIcon}
				</Row>
			</TouchableOpacity>
		);
	};

	const applyFilter = () => {
		setClassFilters(classFiltersToApply);
		setVenueFilters(venueFiltersToApply);
		onClose();
	};

	return (
		<BottomPanel
			title="Class Filter"
			visible={visible}
			style={styles.panel}
			onClose={() => {
				onClose();
				setClassFiltersToApply(classFilters);
				setVenueFiltersToApply(venueFilters);
			}}
			rightTitle={
				<TouchableOpacity onPress={onReset}>
					<Text size="md" style={styles.resetText}>
						Reset
					</Text>
				</TouchableOpacity>
			}
		>
			<View style={styles.container}>
				{renderFilterOptions(FilterTypeEnum.CLASS)}

				<Spacer />

				{venueFilters.length > 0
					? renderFilterOptions(FilterTypeEnum.VENUE)
					: null}

				<Button
					onPress={applyFilter}
					style={styles.buttonStyle}
					labelStyle={styles.buttonLabel}
					title="Apply Filter"
				/>
			</View>
		</BottomPanel>
	);
};

export { FilterTypeEnum };
export default CalendarFilterPanel;

const styles = StyleSheet.create({
	panel: {
		backgroundColor: memberTheme.colors.surface,
		borderTopLeftRadius: memberTheme.radius.lg,
		borderTopRightRadius: memberTheme.radius.lg,
		overflow: 'hidden',
	},
	container: {
		padding: memberTheme.spacing.lg,
		paddingBottom: memberTheme.spacing.xl,
	},
	optionRow: {
		minHeight: 68,
		paddingHorizontal: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.md,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	optionTitle: {
		color: memberTheme.colors.text,
		fontWeight: '600',
	},
	resetText: {
		color: memberTheme.colors.textMuted,
	},
	buttonStyle: {
		minHeight: 52,
		justifyContent: 'center',
		marginTop: memberTheme.spacing.lg,
		backgroundColor: memberTheme.colors.primary,
		borderColor: memberTheme.colors.primary,
		borderRadius: memberTheme.radius.sm,
	},
	buttonLabel: {
		color: memberTheme.colors.surface,
		fontWeight: '700',
	},
});
