import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { GetAttendanceGraphSchema } from '@/types/schemas/response';

export default async (type: string, year: string) => {
	const searchParams: Record<string, string | number | boolean> =
		type === 'year' ? { type } : { type, year };

	const response = await securedInstance()
		.get(ApiRoutes.attendanceGraph, {
			searchParams,
		})
		.json();

	return GetAttendanceGraphSchema.parse(response);
};
