import { Button, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { GetSubscriptionInfoType } from '@/types/schemas/response';
import { SubscriptionType } from '@/types/schemas/subscription';
import { isEmpty } from 'lodash';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// made this a different component to avoid rerendering when 'invoice notice via email', 'Past', and 'Last 10 transactions' gets toggled
const SubscriptionList = ({
	type,
	title,
	data,
}: {
	type: keyof GetSubscriptionInfoType;
	title?: string;
	data: GetSubscriptionInfoType;
}) => {
	const reversedData: SubscriptionType[] = [
		...(data?.[type] as SubscriptionType[]),
	].reverse();

	const goToSubscription = (id: number, subscriptionType: string) => {
		navigate('SubscriptionDetails', { id, subscriptionType });
	};

	if (!data || isEmpty(data[type])) {
		return null;
	}

	return (
		<View style={styles.listContainer}>
			{title && (
				<>
					<Text size="md" color="darkgray">
						{`${title}`}
					</Text>
					<Spacer size="xs" />
				</>
			)}
			{reversedData.map((item: SubscriptionType, index: number) => {
				const { name } = item;
				return (
					<View key={index} style={styles.subscriptionCard}>
						<View style={styles.statusDot} />
						<View style={styles.subscriptionCopy}>
							<Text bold style={styles.subscriptionName}>
								{name}
							</Text>
							<Text style={styles.subscriptionHint}>
								View membership details
							</Text>
						</View>
						<Button
							title="View"
							compact
							style={styles.viewButton}
							labelStyle={styles.viewButtonLabel}
							onPress={() => goToSubscription(item.id, type)}
						/>
					</View>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	listContainer: {
		marginTop: memberTheme.spacing.xs,
	},
	subscriptionCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.md,
		borderWidth: 1,
		flexDirection: 'row',
		marginBottom: memberTheme.spacing.sm,
		padding: memberTheme.spacing.md,
	},
	statusDot: {
		backgroundColor: memberTheme.colors.success,
		borderRadius: 5,
		height: 10,
		marginRight: memberTheme.spacing.md,
		width: 10,
	},
	subscriptionCopy: { flex: 1 },
	subscriptionName: {
		color: memberTheme.colors.ink,
		fontSize: 15,
	},
	subscriptionHint: {
		color: memberTheme.colors.textMuted,
		fontSize: 12,
		marginTop: memberTheme.spacing.xs,
	},
	viewButton: {
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.pill,
		minWidth: 64,
	},
	viewButtonLabel: {
		color: memberTheme.colors.primaryDeep,
		fontSize: 12,
		textTransform: 'none',
	},
	subscriptionButtonStyle: {
		marginBottom: 15,
		...layout.shadowLight,
	},
	subscriptionButtonLabelStyle: {
		color: config.colors.info,
		fontSize: config.metrics.md,
		textTransform: 'capitalize',
	},
	addSubscriptionButtonLabelStyle: {
		fontSize: config.metrics.md,
		textTransform: 'capitalize',
	},
});

export default React.memo(SubscriptionList);
