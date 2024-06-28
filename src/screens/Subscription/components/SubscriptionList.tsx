import { Button, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
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
	const reversedData: SubscriptionType[] = (
		data?.[type] as SubscriptionType[]
	).reverse();

	const goToSubscription = (id: number, subscriptionType: string) => {
		navigate('SubscriptionDetails', { id, subscriptionType });
	};

	if (!data || isEmpty(data[type])) {
		return null;
	}

	return (
		<View>
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
					<Button
						key={index}
						title={name}
						dark
						mode="outlined"
						style={styles.subscriptionButtonStyle}
						labelStyle={styles.subscriptionButtonLabelStyle}
						onPress={() => goToSubscription(item.id, type)}
					/>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
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
