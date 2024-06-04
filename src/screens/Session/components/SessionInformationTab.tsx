import { Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { SessionDetailSchemaType } from '@/types/schemas/session';
import { Func } from '@/utils';
import useStore from '@/zustand/Store';
import moment from 'moment';
import { useMemo } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

const { metrics } = config;

interface SessionInformationTabProps {
	session: SessionDetailSchemaType;
}

const SessionInformationTab = ({ session }: SessionInformationTabProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);

	const startTime = useMemo(() => moment(session?.start_datetime), [session]);
	const endTime = useMemo(() => moment(session?.end_datetime), [session]);
	const description = useMemo(() => session?.description, [session]);

	const hasBookingLock = useMemo(() => {
		if (session) {
			return session?.booking_HH > 0 || session.booking_MM > 0;
		}
		return false;
	}, [session]);

	const hasAttendanceLock = useMemo(() => {
		if (session) {
			return session?.locktime_HH > 0 || session.locktime_MM > 0;
		}
		return false;
	}, [session]);

	const cancelDate = useMemo(() => {
		if (session) {
			return moment
				.parseZone(session.start_datetime)
				.subtract({
					hours: session.locktime_HH,
					minutes: session.locktime_MM,
				})
				.format('h:mmA, DD MMM');
		}
		return '';
	}, [session]);

	const blockDate = useMemo(() => {
		if (session) {
			return moment
				.parseZone(session.start_datetime)
				.subtract({
					hours: session.booking_HH,
					minutes: session.booking_MM,
				})
				.format('h:mmA, DD MMM');
		}
		return '';
	}, [session]);

	const coachList = useMemo(() => {
		let sessionCoach = [{ name: 'Coaching Staff', isMe: false }];
		if (session && session?.class_event?.coaches.length > 0) {
			sessionCoach = session.class_event.coaches.map(coach => ({
				name:
					coach[1] && coach[2]
						? `${String(coach[1]).trim()} ${String(
								coach[2],
						  ).trim()}`
						: '',
				isMe: coach[0] === loggedInUser?.id,
			}));
		}

		return sessionCoach;
	}, [session]);

	const videoLink = useMemo(() => {
		let link = session?.video_link ?? '';
		if (link && !link.includes('https://') && !link.includes('http://')) {
			link = `https://${link}`;
		}

		return Func.validURL(link) ? link : '';
	}, [session]);

	return (
		<View style={{ paddingHorizontal: metrics.sm }}>
			<ScrollView>
				<View style={styles.infoSectionContainer}>
					<Text size="md" bold color="brand">
						Session Details
					</Text>
					<Spacer size="sm" />
					<Text size="rg">
						{`${startTime.format('ddd')}, ${startTime.format(
							'DD MMM',
						)}: ${startTime.format('h:mmA')} - ${endTime.format(
							'h:mmA',
						)}`}
					</Text>
					{hasAttendanceLock && (
						<Text size="rg">
							{`No Cancellations After: ${cancelDate}`}
						</Text>
					)}
					{hasBookingLock && (
						<Text size="rg">{`No Booking After: ${blockDate}`}</Text>
					)}

					<Row style={layout.wrap}>
						<Text size="rg">Coach: </Text>
						{coachList.map((e, i) => {
							const comma = i !== coachList.length - 1 ? ',' : '';
							const youAppend = e.isMe ? ' (You)' : '';

							return (
								<Text
									key={e.name + String(i)}
									size="rg"
									color={e.isMe ? 'info' : 'darkgray'}
									style={styles.coachName}
								>
									{e.name + youAppend + comma}
								</Text>
							);
						})}
					</Row>

					{session?.venue_id && (
						<>
							<Spacer size="sm" />
							<Text size="rg">Location:</Text>
							<Text size="md" color="info">
								{session?.venue_name}

								{session?.venue_location
									? ` (${session?.venue_location})`
									: ''}
							</Text>
						</>
					)}
				</View>

				{videoLink ? (
					<View style={styles.infoSectionContainer}>
						<Text size="md" bold color="brand">
							Online Session Link
						</Text>
						<Spacer size="sm" />
						<TouchableOpacity
							onPress={() => void Linking.openURL(videoLink)}
						>
							<Text size="md" color="info">
								{videoLink}
							</Text>
						</TouchableOpacity>
					</View>
				) : null}

				<View style={styles.infoSectionContainer}>
					<Text size="md" bold color="brand">
						Class Description
					</Text>
					<Spacer size="sm" />
					{description ? (
						<Text size="rg">{description}</Text>
					) : (
						<Text size="rg" color="darkgray">
							No description found
						</Text>
					)}
				</View>
			</ScrollView>
		</View>
	);
};

export default SessionInformationTab;

const styles = StyleSheet.create({
	coachName: { marginRight: 5 },
	infoSectionContainer: {
		marginHorizontal: 5,
		marginBottom: '5%',
		paddingVertical: 10,
		paddingHorizontal: 7,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: '#f2f2f2',
		...layout.shadowLight,
	},
});
