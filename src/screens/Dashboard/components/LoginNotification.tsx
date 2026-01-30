import { Button, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import { AnnouncementsItemType, NewActionType } from '@/types/schemas/message';
import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const LoginNotification = ({
	item,
	onClose,
	index,
	navigation,
}: {
	item: AnnouncementsItemType;
	onClose: () => void;
	index: number;
	navigation: (screen: string, params?: object) => void;
}) => {
	// Use type assertion to bypass TypeScript error for navigation

	const [showNotification, setShowNotification] = useState<boolean>(true);

	// const { setAppState } = useStore(state => ({
	// 	setAppState: state.setAppState,
	// }));

	const hasAction = item.action && (item.action as NewActionType).screen;

	const imageAttachment = item.attached_files
		? item.attached_files.find(file => file.type === 'image')
		: null;

	const navigateToScreen = (screen: string) => {
		setShowNotification(false);
		switch (screen) {
			case 'dashboard':
				navigation('Dashboard');
				break;
			case 'calendar':
				navigation('Calendar');
				break;
			case 'store':
				navigation('Shop');
				break;
			case 'inbox':
				navigation('Inbox');
				break;
			case 'memberships':
				navigation('Subscription');
				break;
			case 'settings':
				navigation('MenuStack', { screen: 'MyDetails' });
				break;
			default:
				break;
		}
	};

	return (
		<Modal visible={showNotification} transparent animationType="fade">
			<View style={styles.container}>
				<View style={styles.cardContainer}>
					<ScrollView showsVerticalScrollIndicator>
						<Icon
							name="close-outline"
							size={config.metrics.lg}
							style={styles.closeIcon}
							onPress={onClose}
						/>
						<Text size="md" bold center>
							{item.subject}
						</Text>
						<Spacer />
						{imageAttachment && (
							<Image
								source={{ uri: imageAttachment.public_url }}
								style={styles.image}
							/>
						)}
						<Spacer size={config.metrics.lg} />
						<Text size="rg" center>
							{item.message}
						</Text>
						<Spacer />
					</ScrollView>

					{hasAction && (
						<Button
							sm
							buttonColor={config.colors.brand}
							labelStyle={{
								color: config.backgrounds.light,
							}}
							style={{ marginBottom: config.metrics.sm }}
							onPress={() => navigateToScreen('performance')}
							title={
								(item.action as NewActionType).text ?? 'View'
							}
						/>
					)}
					<Button
						sm
						buttonColor={config.colors.brand}
						labelStyle={{ color: config.backgrounds.light }}
						onPress={() =>
							navigation('InboxStack', {
								screen: 'Conversation',
								params: {
									conversation: item,
									index,
								},
							})
						}
						title="View Message"
					/>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'rgba(0,0,0,0.5)',
		flex: 1,
		paddingHorizontal: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	touchableClose: {
		flex: 0.3,
	},
	card: {
		width: '100%',
		alignSelf: 'center',
		backgroundColor: config.backgrounds.light,
	},
	image: {
		width: '100%',
		height: 300,
		resizeMode: 'cover',
	},
	closeIcon: {
		paddingBottom: config.metrics.sm,
		alignSelf: 'flex-end',
	},
	cardContainer: {
		width: '100%',
		maxHeight: '80%', // This applies correctly
		backgroundColor: config.backgrounds.light,
		padding: 15,
	},
});

export default LoginNotification;
