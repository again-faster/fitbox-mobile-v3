// TODO: create a util function for moment-timezone with the user's timezone
import useAuth from '@/auth/hooks/useAuth';
import { ScrollView } from '@/components/atoms';
import { getBookedSessions } from '@/services/users';
import { config } from '@/theme/_config';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import moment from 'moment-timezone';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import BookedSessionCard, {
	BookedSessionCardProps,
} from '../Dashboard/components/BookedSessionCard';

const BookingScreen = () => {
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(true);
	const [upcomingSessions, setUpcomingSessions] = useState<
		BookedSessionCardProps[]
	>([]);
	const { user } = useAuth();
	const timezone = user?.user_data.dob.timezone as string;

	useEffect(() => {
		void getUpcomingSessions();
	}, []);

	const onRefresh = () => {
		void getUpcomingSessions();
	};

	const getUpcomingSessions = async () => {
		setLoading(true);
		const memberSessions: BookedSessionCardProps[] = [];

		try {
			// let res = await RestService.getNextSessions(selectedClassIds.length ? selectedClassIds.join() : null);
			const res = await getBookedSessions();

			if (res.data && res.data.length > 0) {
				// Parse the response data
				res.data.forEach(session => {
					if (
						moment
							.tz(session.calendar_event.end_datetime, timezone)
							.add(30, 'minutes')
							.isAfter()
					) {
						memberSessions.push({
							id: session.event_id,
							startTime: session.calendar_event.start_datetime,
							endTime: session.calendar_event.end_datetime,
							title: session.calendar_event.comment,
							venue: session.calendar_event.venue_id
								? session.calendar_event.venue_name
								: undefined,
							isCoach: false,
							waitlistEnabled:
								!!session.waitlist_info.enable_waitlist,
							waitlistTime: Number(
								session.waitlist_info.waitlist_timelimit,
							),
							color: session.fb_class.class_colour_hex,
						});
					}
				});
			}

			if (res.staffSessions && res.staffSessions.length > 0) {
				res.staffSessions.forEach(session => {
					if (
						moment
							.tz(session.end, timezone)
							.add(30, 'minutes')
							.isAfter()
					) {
						memberSessions.push({
							id: session.id,
							startTime: session.start,
							endTime: session.end,
							title: session.title,
							venue: session.venue_id
								? String(session.venue_name)
								: undefined,
							isCoach: true,
							waitlistEnabled: false,
							waitlistTime: 0,
							color: session.class_colour_hex,
						});
					}
				});
			}
		} catch (err) {
			Say.err(err as ICatchError);
		} finally {
			// sort sessions by start time
			memberSessions.sort((sessionA, sessionB) => {
				const startA = moment.tz(sessionA.startTime, timezone);
				const startB = moment.tz(sessionB.startTime, timezone);
				return startA && startB && startA > startB ? 1 : -1;
			});

			setUpcomingSessions(memberSessions);
			setLoading(false);
			setRefreshing(false);
		}
	};

	return loading ? (
		<View style={styles.loader}>
			<ActivityIndicator color={config.colors.brand} size="large" />
		</View>
	) : (
		<View style={styles.container}>
			<ScrollView refreshing={refreshing} onRefresh={onRefresh}>
				{upcomingSessions.map(({ ...rest }, i: number) => {
					return <BookedSessionCard key={i} {...rest} />;
				})}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingTop: config.metrics.lg,
		paddingHorizontal: config.metrics.lg,
		flex: 1,
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
	},
});

export default BookingScreen;
