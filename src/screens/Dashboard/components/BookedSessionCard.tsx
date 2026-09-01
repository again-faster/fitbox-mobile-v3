import { Button, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { ApplicationStackParamList } from '@/types/navigation';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const { metrics, fonts } = config;

export interface BookedSessionCardProps {
	id: number;
	startTime: string;
	endTime: string;
	title: string;
	venue?: string;
	isCoach: boolean;
	waitlistEnabled: boolean;
	waitlistTime: number;
	color: string;
	compact?: boolean;
}

const BookedSessionCard = ({
	id,
	startTime,
	endTime,
	title,
	venue,
	isCoach,
	waitlistEnabled,
	waitlistTime,
	color,
	compact = false,
}: BookedSessionCardProps) => {
	const navigation =
		useNavigation<NavigationProp<ApplicationStackParamList>>();

	const handlePress = () =>
		navigation.navigate('Session', {
			id,
			title,
			waitlistEnabled,
			waitlistTime,
		});

	const buttonStyle = {
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.primary,
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			accessibilityRole="button"
			accessibilityLabel={`Open ${title}`}
		>
			<View
				testID="booked-session-card"
				style={[
					styles.container,
					compact ? styles.compactContainer : null,
				]}
			>
				<Row style={styles.bookingDetails}>
					<View style={layout.justifyCenter}>
						<Text bold size="sm" center>
							{moment(startTime).format('DD MMM')}
						</Text>
						<Text size="sm" color="mute" center>
							{moment(startTime).format('ddd')}
						</Text>
					</View>

					<View
						style={[
							styles.divider,
							{ backgroundColor: color || fonts.colors.brand },
						]}
					/>

					<View style={layout.flex_1}>
						<Text bold size="md" numberOfLines={2}>
							{title}
						</Text>

						{venue ? (
							<Text bold color="info" size="rg">
								{venue}
							</Text>
						) : null}

						<Text size="sm">
							{moment(startTime).format('h:mmA')} -{' '}
							{moment(endTime).format('h:mmA')}
						</Text>
					</View>
				</Row>

				<Spacer horizontal size="xs" />

				<View style={layout.flex_1}>
					{isCoach ? (
						<Button
							title="Coach"
							style={buttonStyle}
							labelStyle={{
								color: config.colors.info,
							}}
						/>
					) : (
						<Button
							title="Booked"
							variant="brand"
							sm
							compact
							mode="contained"
						/>
					)}
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default memo(BookedSessionCard);

const styles = StyleSheet.create({
	container: {
		backgroundColor: memberTheme.colors.surface,
		flexDirection: 'row',
		padding: memberTheme.spacing.lg,
		alignItems: 'center',
		borderColor: memberTheme.colors.border,
		borderWidth: 1,
		borderRadius: memberTheme.radius.lg,
		...memberTheme.shadow,
	},
	compactContainer: {
		minHeight: 96,
		padding: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.md,
		shadowOpacity: 0.04,
		elevation: 1,
	},
	warningTxt: {
		color: '#595959',
		textAlign: 'center',
		maxWidth: 100,
	},
	btnOutline: {
		borderColor: fonts.colors.darkgray,
		borderWidth: 1,
		width: 'auto',
	},
	divider: {
		borderRadius: 8,
		width: 5,
		marginHorizontal: metrics.rg,
	},
	bookingDetails: {
		flex: 2.8,
	},
});
