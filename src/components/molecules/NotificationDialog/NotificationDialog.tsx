import { Button, Card, Row, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { NotificationsType } from '@/types/schemas/notifications';
import useStore from '@/zustand/Store';
import {
	SafeAreaView,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import Modal from '../Modal/Modal';

const NotificationDialog = ({
	notification,
}: {
	notification: NotificationsType[];
}) => {
	const { setAppState } = useStore(state => ({
		setAppState: state.setAppState,
	}));

	const latestNotification: NotificationsType = notification[
		notification.length - 1
	] as NotificationsType;

	if (!latestNotification) return null;

	const navigateToInbox = () => {
		setAppState('showModalNotification', false);
		const latestList: string = latestNotification.data.user_list as string;
		const navParams = {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			user_list: JSON.parse(latestList),
			subject: latestNotification.title,
			convo_id: latestNotification.data.convo_id,
			reload: true,
		};
		navigate('InboxStack', {
			screen: 'Conversation',
			params: { conversation: navParams },
			initial: false,
		});
	};

	return (
		<Modal visible>
			<SafeAreaView style={styles.container}>
				<TouchableWithoutFeedback
					onPress={() => setAppState('showModalNotification', false)}
				>
					<View style={styles.touchableClose} />
				</TouchableWithoutFeedback>
				<Card style={styles.card}>
					<Text size="md" color="brand" center bold>
						New message received
					</Text>
					<Spacer />
					<Text center size="lg">
						{latestNotification.data.sender_name}
					</Text>
					<Spacer />
					<Row spacing="space-between">
						<View style={layout.flex_1}>
							<Button
								sm
								buttonColor={config.colors.brand}
								onPress={() =>
									setAppState('showModalNotification', false)
								}
								title="Dismiss"
							/>
						</View>
						<Spacer horizontal />
						<View style={layout.flex_1}>
							<Button
								sm
								buttonColor={config.colors.brand}
								labelStyle={{ color: config.backgrounds.light }}
								onPress={navigateToInbox}
								title="View"
							/>
						</View>
					</Row>
				</Card>
				<TouchableWithoutFeedback
					onPress={() => setAppState('showModalNotification', false)}
				>
					<View style={layout.flex_1} />
				</TouchableWithoutFeedback>
			</SafeAreaView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'rgba(0,0,0,0.04)',
		flex: 1,
		paddingHorizontal: 20,
	},
	touchableClose: {
		flex: 0.3,
	},
	card: {
		width: '80%',
		alignSelf: 'center',
		paddingVertical: 15,
	},
});

export default NotificationDialog;
