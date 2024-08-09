import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { GetAttendanceReportSchema } from '@/types/schemas/response';

export default async (user_id: number) => {
	const response = await securedInstance()
		.get(ApiRoutes.attendanceReport, {
			searchParams: {
				user_id,
			},
		})
		.json();

	return GetAttendanceReportSchema.parse(response);
};
