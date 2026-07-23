import { Row, ScrollView, Spacer, Text } from '@/components/atoms';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { SessionDetailSchemaType } from '@/types/schemas/session';
import { Func } from '@/utils';
import useStore from '@/zustand/Store';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { useLayoutEffect, useMemo } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SessionInformationTabProps {
	session: SessionDetailSchemaType;
}

const SessionInformationTab = ({ session }: SessionInformationTabProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);

	const startTime = useMemo(() => moment(session?.start_datetime), [session]);
	const endTime = useMemo(() => moment(session?.end_datetime), [session]);
	const description = useMemo(() => session?.description, [session]);

	const navigation = useNavigation();

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => null,
		});
	}, []);

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
		<View style={styles.screen}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.infoSectionContainer}>
					<Text size="md" bold style={styles.sectionTitle}>
						Session Details
					</Text>
					<Spacer size="sm" />
					<Text size="rg" style={styles.primaryDetail}>
						{`${startTime.format('ddd')}, ${startTime.format(
							'DD MMM',
						)}: ${startTime.format('h:mmA')} - ${endTime.format(
							'h:mmA',
						)}`}
					</Text>
					{hasAttendanceLock && (
						<Text size="rg" style={styles.ruleText}>
							{`No Cancellations After: ${cancelDate}`}
						</Text>
					)}
					{hasBookingLock && (
						<Text size="rg" style={styles.ruleText}>
							{`No Booking After: ${blockDate}`}
						</Text>
					)}

					<Row style={layout.wrap}>
						<Text size="rg" style={styles.detailLabel}>
							Coach:{' '}
						</Text>
						{coachList.map((e, i) => {
							const comma = i !== coachList.length - 1 ? ',' : '';
							const youAppend = e.isMe ? ' (You)' : '';

							return (
								<Text
									key={e.name + String(i)}
									size="rg"
									style={[
										styles.coachName,
										e.isMe && styles.highlightText,
									]}
								>
									{e.name + youAppend + comma}
								</Text>
							);
						})}
					</Row>

					{session?.venue_id && (
						<>
							<Spacer size="sm" />
							<Text size="rg" style={styles.detailLabel}>
								Location
							</Text>
							<Text size="md" style={styles.highlightText}>
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
						<Text size="md" bold style={styles.sectionTitle}>
							Online Session Link
						</Text>
						<Spacer size="sm" />
						<TouchableOpacity
							onPress={() => void Linking.openURL(videoLink)}
							accessibilityRole="link"
						>
							<Text size="md" style={styles.linkText}>
								{videoLink}
							</Text>
						</TouchableOpacity>
					</View>
				) : null}

				<View style={styles.infoSectionContainer}>
					<Text size="md" bold style={styles.sectionTitle}>
						Class Description
					</Text>
					<Spacer size="sm" />
					{description ? (
						<Text size="rg" style={styles.descriptionText}>
							{description}
						</Text>
					) : (
						<Text size="rg" style={styles.emptyText}>
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
	screen: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
	},
	scrollContent: {
		paddingHorizontal: memberTheme.spacing.md,
		paddingBottom: memberTheme.spacing.xxl,
	},
	coachName: {
		marginRight: 5,
		color: memberTheme.colors.textMuted,
	},
	infoSectionContainer: {
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.md,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
		...memberTheme.shadow,
	},
	sectionTitle: {
		color: memberTheme.colors.primary,
		fontSize: 15,
	},
	primaryDetail: {
		color: memberTheme.colors.text,
		fontWeight: '600',
		marginBottom: memberTheme.spacing.xs,
	},
	detailLabel: {
		color: memberTheme.colors.text,
		fontWeight: '600',
	},
	ruleText: {
		color: memberTheme.colors.textMuted,
		fontSize: 13,
		lineHeight: 19,
	},
	highlightText: {
		color: memberTheme.colors.primary,
	},
	linkText: {
		color: memberTheme.colors.primary,
		textDecorationLine: 'underline',
	},
	descriptionText: {
		color: memberTheme.colors.text,
		lineHeight: 21,
	},
	emptyText: {
		color: memberTheme.colors.textMuted,
	},
});
