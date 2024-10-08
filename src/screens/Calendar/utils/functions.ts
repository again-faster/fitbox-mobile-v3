import { ClassItemData } from '@/zustand/interface/SessionInterface';

export interface FilterCriteria {
	selectedClassIds: number[];
	selectedVenueIds: number[];
}

export function shouldIncludeClass(
	item: ClassItemData,
	criteria: FilterCriteria,
): boolean {
	const matchesClassFilter =
		criteria.selectedClassIds.length === 0 ||
		criteria.selectedClassIds.includes(item.classId as number);

	const matchesVenueFilter =
		criteria.selectedVenueIds.length === 0 ||
		criteria.selectedVenueIds.includes(item.venueId as number) ||
		criteria.selectedVenueIds.includes(-1);

	return matchesClassFilter && matchesVenueFilter;
}
