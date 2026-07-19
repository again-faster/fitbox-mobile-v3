import { Button, Row } from '@/components/atoms';
import { BookButton } from '@/components/molecules';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { Func } from '@/utils';
import moment from 'moment';
import { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SessionActionButtonsProps {
	classId: number;
	eventId: number;
	subscribed: boolean;
	isAttending: boolean;
	spotsLeft: number;
	isWaitlist: boolean;
	islocked: boolean;
	startTime: string;
	waitlistEnabled: boolean;
	waitlistTime: number;
	disableUnbooking?: boolean;
	waitlistNumber?: number;
	waitlistLength?: number;
}

const SessionActionButtons = ({
	classId,
	eventId,
	subscribed,
	isAttending: propsIsAttending,
	spotsLeft,
	isWaitlist,
	islocked,
	startTime,
	waitlistEnabled,
	waitlistTime,
	disableUnbooking = false,
	waitlistNumber,
	waitlistLength,
}: SessionActionButtonsProps) => {
	const [isAttending, setAttending] = useState<boolean>(propsIsAttending);

	const renderLeftButton = useCallback(() => {
		if (isAttending) {
			return <Button sm mode="outlined" title="Session Booked" />;
		}

		if (isWaitlist) {
			return (
				<Button
					sm
					mode="outlined"
					title={
						waitlistNumber
							? `${Func.toOrdinal(waitlistNumber)} on Waitlist`
							: 'Waitlisted'
					}
				/>
			);
		}

		if (spotsLeft === 0) {
			return <Button sm mode="outlined" title="Full" />;
		}

		if (spotsLeft <= 3 && spotsLeft > 0) {
			return (
				<Button
					sm
					mode="outlined"
					title={`${spotsLeft} ${
						spotsLeft > 1 ? 'spots' : 'spot'
					} left`}
				/>
			);
		}

		return null;
	}, [isAttending, isWaitlist, spotsLeft]);

	const renderRightButton = useCallback(() => {
		const waitlistBtn =
			waitlistEnabled &&
			moment(startTime).diff(moment(), 'minutes') >
				Number(waitlistTime) * 60;

		return (
			<BookButton
				eventId={eventId}
				classId={classId}
				isSubscribed={subscribed}
				isAttending={isAttending}
				spotsLeft={spotsLeft}
				isWaitlisted={isWaitlist}
				startDate={startTime}
				isBookingLocked={islocked}
				waitlistBtn={waitlistBtn}
				setAttending={setAttending}
				isPreviewMode
				disableUnbooking={disableUnbooking}
				waitlistLength={waitlistLength}
			/>
		);
	}, [islocked, isAttending, isWaitlist, spotsLeft, waitlistEnabled]);

	return !subscribed ? (
		<Text style={[styles.warningTxt, styles.container]}>
			This class is not included in your membership. Please speak with
			your gym to upgrade.
		</Text>
	) : (
		<Row spacing="space-around" style={styles.container}>
			<View style={layout.flex_1}>{renderLeftButton()}</View>
			<View style={layout.flex_1}>{renderRightButton()}</View>
		</Row>
	);
};

export default memo(SessionActionButtons);

const styles = StyleSheet.create({
	container: {
		marginHorizontal: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.sm,
		paddingHorizontal: memberTheme.spacing.md,
		paddingVertical: memberTheme.spacing.md,
		gap: memberTheme.spacing.sm,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.md,
		backgroundColor: memberTheme.colors.surface,
	},
	warningTxt: {
		color: memberTheme.colors.textMuted,
		textAlign: 'center',
		fontSize: 14,
		lineHeight: 20,
	},
});
