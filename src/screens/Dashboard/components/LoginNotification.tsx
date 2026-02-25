import { Button, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import { AnnouncementsItemType, NewActionType } from '@/types/schemas/message';
import { Func } from '@/utils';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const LoginNotification = ({
	item,
	onClose,
	index,
	navigation,
	resetCurrentIndex,
}: {
	item: AnnouncementsItemType;
	onClose: () => void;
	index: number;
	navigation: (screen: string, params?: object) => void;
	resetCurrentIndex: () => void;
}) => {
	const hasAction =
		item?.action &&
		(item.action as NewActionType).screen &&
		(item.action as NewActionType).screen !== 'none';

	const imageAttachment = item?.attached_files
		? item.attached_files.find(file => file.type === 'image')
		: null;

	const otherAttachments = item?.attached_files
		? item.attached_files.filter(file => file !== imageAttachment)
		: [];

	const maxDisplayed = 2;
	const displayedAttachments =
		otherAttachments.length > maxDisplayed
			? otherAttachments.slice(0, maxDisplayed)
			: otherAttachments;
	const remainingCount = Math.max(0, otherAttachments.length - maxDisplayed);

	const MAX_CHARS = 200;
	const messageText = Func.stripHtmlTags(item.message);
	const isTruncated = messageText.length > MAX_CHARS;

	const navigateToScreen = (screen: string) => {
		resetCurrentIndex();
		switch (screen) {
			case 'calendar':
				navigation('Calendar');
				break;
			case 'store':
				navigation('Shop');
				break;
			case 'inbox':
				navigation('InboxStack');
				break;
			case 'memberships':
				navigation('Subscription');
				break;
			case 'settings':
				navigation('MenuTab');
				break;
			case 'performance':
				navigation('MenuTab', { screen: 'PerformanceSummary' });
				break;
			default:
				break;
		}
	};

	return (
		<Modal visible transparent animationType="fade">
			<Pressable style={styles.container} onPress={onClose}>
				<Pressable
					style={styles.cardContainer}
					onPress={e => e.stopPropagation()}
				>
					<View>
						<Icon
							name="close-outline"
							size={config.metrics.lg}
							style={styles.closeIcon}
							onPress={onClose}
						/>
						<Text size="lg" bold center>
							{item.subject}
						</Text>
						<Spacer />
						{imageAttachment && (
							<Image
								source={{ uri: imageAttachment.public_url }}
								style={styles.image}
							/>
						)}
						<Spacer />
						{otherAttachments.length > 0 && (
							<View style={styles.otherAttachments}>
								{displayedAttachments.map(file => (
									<View
										key={file.id}
										style={styles.attachmentRow}
									>
										<Icon
											name="attach-outline"
											size={14}
											style={styles.attachmentIcon}
										/>
										<Text
											size="sm"
											style={styles.attachmentLabel}
										>
											{file.name}
										</Text>
									</View>
								))}
								{remainingCount > 0 && (
									<Text
										size="sm"
										style={styles.attachmentLabel}
									>
										and {remainingCount} other
										{remainingCount === 1
											? ' attachment'
											: ' attachments'}
									</Text>
								)}
							</View>
						)}
						<Spacer size={config.metrics.lg} />
						<Text size="rg" center>
							{!isTruncated ? (
								messageText
							) : (
								<>
									{messageText.substring(0, MAX_CHARS)}
									{isTruncated && (
										<>
											<Text>... </Text>
											<Text
												style={styles.viewMoreText}
												onPress={() =>
													navigation('InboxStack', {
														screen: 'Conversation',
														params: {
															conversation: item,
															index,
														},
													})
												}
											>
												View More
											</Text>
										</>
									)}
								</>
							)}
						</Text>
						<Spacer />
					</View>

					{hasAction && (
						<Button
							sm
							buttonColor={config.colors.brand}
							labelStyle={{
								color: config.backgrounds.light,
							}}
							style={{ marginBottom: config.metrics.sm }}
							onPress={() =>
								navigateToScreen(
									(item.action as NewActionType).screen,
								)
							}
							title={`View ${(item.action as NewActionType).screen.charAt(0).toUpperCase() + (item.action as NewActionType).screen.slice(1)}`}
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
				</Pressable>
			</Pressable>
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
		resizeMode: 'contain',
		height: 300,
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
	viewMoreText: {
		color: config.colors.brand,
		fontWeight: '600',
	},
	otherAttachments: {
		marginTop: config.metrics.sm,
	},
	attachmentRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	attachmentIcon: {
		color: '#666',
		marginRight: 6,
	},
	attachmentLabel: {
		fontSize: 12,
		color: '#666',
	},
});

export default LoginNotification;
