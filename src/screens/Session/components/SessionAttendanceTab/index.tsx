import { Button } from '@/components/atoms';
import { FlatList } from '@/components/molecules';
import { config } from '@/theme/_config';
import {
	SessionDetailSchemaType,
	SessionMemberAttendanceSchemaType,
} from '@/types/schemas/session';
import useStore from '@/zustand/Store';
import { sortBy } from 'lodash';
import { useCallback } from 'react';
import AttendanceItem from './components/AttendanceItem';

const { metrics } = config;

interface SessionAttendanceTabProps {
	session: SessionDetailSchemaType;
}
const SessionAttendanceTab = ({ session }: SessionAttendanceTabProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);
	const isStaff = loggedInUser?.user_data.is_staff;
	const bookedMembers = session?.member_attendance ?? [];
	const attendanceLimit = Number(session?.attendance_limit);

	// TODO: For adding/removing attendance (Staff only)
	// const [processingMembers, setProcessingMembers] = useState<number[]>([]);
	const toggleAttendanceModal = () => {};

	// Determine if the add button should be shown
	const showAddButton =
		(bookedMembers.length < attendanceLimit || attendanceLimit === null) &&
		isStaff;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const renderItem = useCallback(({ item }: any) => {
		const { user, user_id: userId } =
			item as SessionMemberAttendanceSchemaType;

		return (
			<AttendanceItem
				id={userId}
				avatar={user.profile_image}
				name={`${user.firstname} ${user.lastname}`}
			/>
		);
	}, []);

	const StickyHeaderComponent = (
		<Button
			variant="darkgray"
			mode="outlined"
			title="+ Add Attendance"
			onPress={toggleAttendanceModal}
			style={{
				marginBottom: metrics.md,
				marginHorizontal: metrics.lg,
			}}
		/>
	);

	// Extract the key for each item
	const keyExtractor = (item: SessionMemberAttendanceSchemaType) =>
		item.user_id.toString();

	return (
		<FlatList
			data={sortBy(bookedMembers, 'user_data.first_name')}
			renderItem={renderItem}
			extractor={keyExtractor}
			ListHeaderComponent={showAddButton ? StickyHeaderComponent : null}
		/>
	);
};

export default SessionAttendanceTab;
