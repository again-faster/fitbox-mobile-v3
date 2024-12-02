import { Avatar, Card, Row, Spacer, Text } from '@/components/atoms';
import { Loader } from '@/components/molecules';
import { navigate } from '@/navigators/NavigationRef';
import { getAttendanceProfile } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import resources from '@/theme/resources';
import {
	FailedInvoiceType,
	HealthType,
	InjuriesType,
	ProfileType,
} from '@/types/schemas/user';
import { Constant, Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { isNil } from 'lodash';
import moment from 'moment';
import { useState } from 'react';
import {
	ActivityIndicator,
	Image,
	Linking,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import UserInfoModal from './UserInfoModal';

const { metrics, fonts } = config;

interface AttendanceItemProps {
	id: number;
	avatar: string;
	name: string;
	status: string;
	isStaff: boolean;
	loading: boolean;
	handleCheckInUser: (userId: number) => Promise<void>;
	handleToggleUserAttendance: (
		userId: number,
		override?: boolean,
	) => Promise<void>;
	infoFlags: { name: string; color: string; icon: string }[];
	isBirthday: boolean;
}

type AttendanceInfo = {
	failedInvoices: FailedInvoiceType | null;
	health: HealthType | null;
	injuries: InjuriesType | null;
	profile: ProfileType | null;
};

const AttendanceItem = ({
	id,
	avatar,
	name,
	status,
	isStaff,
	loading,
	handleCheckInUser,
	handleToggleUserAttendance,
	infoFlags,
	isBirthday,
}: AttendanceItemProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);
	const [visible, setVisible] = useState<boolean>(false);
	const [visibileAvatar, setVisibleAvatar] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<string>('info');
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [state, setState] = useState<AttendanceInfo>({
		failedInvoices: null,
		health: null,
		injuries: null,
		profile: null,
	});

	let updatedInfoFlags = infoFlags;

	if (infoFlags.length > 2) {
		updatedInfoFlags = infoFlags.slice(0, 2);
	}

	const tabOptions = [
		{
			name: 'info',
			icon: 'information',
			color: config.colors.info,
		},
		{
			name: 'injury',
			icon: 'faceBandage',
			color: '#D2B48C',
		},
		{
			name: 'health',
			icon: 'hospital-box',
			color: config.colors.danger,
		},
		{
			name: 'payment',
			icon: 'bankCardCancel',
			color: config.colors.success,
		},
	];

	const statusOrder = {
		active: 0,
		suspended: 1,
		pending: 2,
	};

	const handlePressPhone = (phone: string) => {
		const url = `tel:${phone}`;
		Linking.openURL(url).catch(err => Say.err(err as ICatchError));
	};

	const handleOnPress = () => {
		if (showInfo) {
			setState({
				failedInvoices: null,
				health: null,
				injuries: null,
				profile: null,
			});
			setIsLoading(true);
			setVisible(!visible);
			getAttendanceProfile(id)
				.then(res => {
					const sortedMemberships = res.profile?.memberships.sort(
						(a, b) => {
							return (
								statusOrder[
									a.status as keyof typeof statusOrder
								] -
								statusOrder[
									b.status as keyof typeof statusOrder
								]
							);
						},
					);

					setState({
						failedInvoices: res.failedInvoices,
						health: res.health,
						injuries: res.injuries,
						profile: {
							...res.profile,
							memberships: sortedMemberships,
						},
					});
				})
				.catch(() => {
					Say.err('Failed to fetch user profile');
				})
				.finally(() => {
					setIsLoading(false);
					setActiveTab('info');
				});
		} else {
			setVisibleAvatar(!visibileAvatar);
		}
	};

	// Check if member is checked in
	const checkedIn = status === 'checked-in' || isNil(status); // is nil for added member

	const cardStylesList = {
		width: 20,
		height: 15,
		marginTop: 1,
	};
	const injuryStylesList = {
		width: 18,
		height: 18,
		marginTop: -1,
	};

	const isOwner = loggedInUser?.id === id;
	const showInfo = isOwner || isStaff;

	const renderExclamation = () => (
		<MIcon
			name="exclamation-thick"
			size={15}
			style={styles.exclamationIcon}
			color={config.colors.danger}
		/>
	);

	const updateData = (toUpdate?: boolean) => {
		setVisible(true);

		if (toUpdate) {
			getAttendanceProfile(id)
				.then(res => {
					const sortedMemberships = res.profile?.memberships.sort(
						(a, b) => {
							return (
								statusOrder[
									a.status as keyof typeof statusOrder
								] -
								statusOrder[
									b.status as keyof typeof statusOrder
								]
							);
						},
					);

					setState({
						failedInvoices: res.failedInvoices,
						health: res.health,
						injuries: res.injuries,
						profile: {
							...res.profile,
							memberships: sortedMemberships,
						},
					});
				})
				.catch(() => {
					Say.err('Failed to fetch user profile');
				});
		}
	};

	const renderEditHealthButton = () => (
		<TouchableOpacity
			style={styles.editButtonContainer}
			onPress={() => {
				navigate('HealthCapture', {
					fromAttendance: true,
					updateAttendanceProfile: updateData,
				});
				setVisible(false);
			}}
		>
			<Icon
				name="pen"
				size={15}
				color={config.colors.info}
				style={layout.selfCenter}
			/>
		</TouchableOpacity>
	);

	const renderEditProfileButton = () => (
		<TouchableOpacity
			style={styles.editButtonContainer}
			onPress={() => {
				navigate('MyDetails', {
					fromAttendance: true,
					updateAttendanceProfile: updateData,
				});
				setVisible(false);
			}}
		>
			<Icon
				name="pen"
				size={15}
				color={config.colors.info}
				style={layout.selfCenter}
			/>
		</TouchableOpacity>
	);

	const renderNoAccess = () => (
		<View
			style={{
				height: Constant.DEVICEHEIGHT / 4,
				...layout.itemsCenter,
				...layout.justifyCenter,
			}}
		>
			<Text center>
				Your role does not have access to this information.
			</Text>
		</View>
	);

	const renderCloseButton = (type?: string) => (
		<View style={styles.closeButton}>
			<TouchableOpacity
				onPress={() =>
					type === 'member'
						? setVisibleAvatar(false)
						: setVisible(false)
				}
			>
				<MIcon
					name="close"
					size={20}
					color={config.backgrounds.darkgray}
				/>
			</TouchableOpacity>
		</View>
	);

	const nameContainerWidth: ViewStyle = {
		width: showInfo ? '60%' : '80%',
	};

	const loaderHeight = isOwner ? '50.8%' : '48%';
	const injuryScrollHeight =
		state.injuries && state.injuries?.injuries.length > 0
			? styles.scrollHeight
			: { height: '100%' };

	return (
		<>
			<Row style={styles.container}>
				<TouchableOpacity onPress={handleOnPress} style={layout.flex_1}>
					<Row style={styles.detailsContainer}>
						<View style={styles.avatarCon}>
							<Avatar
								source={avatar}
								style={styles.avatarStyle}
								size={43}
							/>
						</View>
						<Spacer horizontal size="xs" />
						<View
							style={[
								styles.attendanceListNameCon,
								nameContainerWidth,
							]}
						>
							<Text numberOfLines={1}>
								{name +
									(id === loggedInUser?.id ? ' (You)' : '')}
							</Text>
						</View>

						{showInfo && (
							<View style={styles.listInfoIconsCon}>
								{updatedInfoFlags.map(item => {
									if (item.name === 'birthday') {
										return (
											<View
												key={item.name}
												style={styles.listInfoIcon}
											>
												<Image
													source={
														resources.icon.birthday
													}
													style={styles.birthday}
												/>
											</View>
										);
									}
									if (
										item.name === 'injury' ||
										item.name === 'payment'
									) {
										return (
											<View
												key={item.name}
												style={styles.listInfoIcon}
											>
												<Image
													source={
														item.name === 'payment'
															? resources.icon
																	.bankCardCancel
															: resources.icon
																	.faceBandage
													}
													style={
														item.name === 'payment'
															? cardStylesList
															: injuryStylesList
													}
												/>
											</View>
										);
									}

									return (
										<View
											key={item.name}
											style={styles.listInfoIcon}
										>
											<MIcon
												name={item.icon}
												size={18}
												color={item.color}
											/>
										</View>
									);
								})}
								{infoFlags.length > 2 && (
									<View style={styles.listInfoIcon}>
										<MIcon
											name="plus-thick"
											size={10}
											color={config.backgrounds.darkgray}
											style={styles.moreCon}
										/>
									</View>
								)}
							</View>
						)}
					</Row>
				</TouchableOpacity>

				<View style={styles.actionButtonContainer}>
					{isStaff && (
						<Row>
							{loading ? (
								<Loader />
							) : (
								<>
									<MIcon
										size={config.fonts.metrics.xl}
										name="account-check"
										color={
											checkedIn
												? config.colors.oceanGreen
												: config.backgrounds.darkgray
										}
										onPress={() =>
											void handleCheckInUser(id)
										}
									/>
									<Spacer horizontal size="sm" />
									<MIcon
										size={config.fonts.metrics.xl}
										name="account-off"
										color={config.backgrounds.darkgray}
										onPress={() =>
											void handleToggleUserAttendance(id)
										}
									/>
								</>
							)}
						</Row>
					)}
				</View>
			</Row>
			<UserInfoModal
				visible={visible}
				onDismiss={() => setVisible(false)}
			>
				<>
					<View style={styles.infoDetailsContainer}>
						{renderCloseButton()}
						<View style={styles.infoAvatarCon}>
							<View style={styles.infoAvatar}>
								<Avatar source={avatar} size={250} />
							</View>
						</View>
						<Text size="lg" bold numberOfLines={2} center>
							{name}
						</Text>
						{state.profile?.contact_phone ? (
							<TouchableOpacity
								onPress={() =>
									handlePressPhone(
										state.profile?.contact_phone as string,
									)
								}
							>
								<Row align="center">
									<Icon
										name="phone"
										color={config.colors.info}
										style={{
											marginRight: config.metrics.sm,
										}}
									/>
									<Text color="info">
										{state.profile.contact_phone}
									</Text>
								</Row>
							</TouchableOpacity>
						) : (
							<View style={styles.contactPhonePlaceHolder} />
						)}
					</View>
					<View style={styles.iconTabContainer}>
						{tabOptions.map(
							(item: {
								name: string;
								icon: string;
								color: string;
							}) => {
								const healthNoData =
									state.health?.allergies.length === 0 &&
									state.health?.pre_existing_conditions
										.length === 0 &&
									state.health?.prescriptions.length === 0;
								const healthOpacity =
									state.health?.has_permission &&
									!healthNoData
										? 1
										: 0.3;
								const iconStyles = {
									opacity:
										item.name === 'health'
											? healthOpacity
											: 1,
									paddingHorizontal: 8,
									paddingBottom: 5,
								};

								const touchableStyles = {
									borderColor: isLoading
										? 'transparent'
										: item.color,
									borderBottomWidth:
										activeTab === item.name ? 2 : 0,
									paddingHorizontal:
										item.name === 'injury' ||
										item.name === 'payment'
											? 10
											: 0,
									paddingBottom:
										item.name === 'injury' ||
										item.name === 'payment'
											? 8
											: 0,
								};

								if (
									item?.name === 'info' ||
									item?.name === 'health'
								) {
									return (
										<TouchableOpacity
											key={item.name}
											onPress={() =>
												setActiveTab(item.name)
											}
											style={touchableStyles}
										>
											<MIcon
												name={item.icon}
												size={25}
												color={item.color}
												style={iconStyles}
											/>
										</TouchableOpacity>
									);
								}

								const cardStyles = {
									width: 21,
									height: 16,
									marginTop: 6,
									opacity:
										state.failedInvoices &&
										state.failedInvoices.length > 0
											? 1
											: 0.3,
								};
								const injuryStyles = {
									width: 20,
									height: 20,
									marginTop: 2,
									opacity:
										state.injuries?.has_permission &&
										state.injuries &&
										state.injuries.injuries.length > 0
											? 1
											: 0.3,
								};
								return (
									<TouchableOpacity
										key={item?.name}
										onPress={() => setActiveTab(item.name)}
										style={touchableStyles}
									>
										<Image
											source={
												item.name === 'payment'
													? resources.icon
															.bankCardCancel
													: resources.icon.faceBandage
											}
											style={
												item.name === 'payment'
													? cardStyles
													: injuryStyles
											}
										/>
									</TouchableOpacity>
								);
							},
						)}
					</View>

					{isLoading ? (
						<View
							style={[
								styles.infoTabContainer,
								layout.justifyCenter,
								{
									height: loaderHeight,
								},
							]}
						>
							<ActivityIndicator
								size="small"
								color={config.colors.brand}
							/>
						</View>
					) : (
						<>
							<ScrollView style={styles.infoTabContainer}>
								{activeTab === 'info' && (
									<View>
										<Row spacing="space-between">
											<Text size="md" bold>
												Profile
											</Text>

											{isOwner &&
												renderEditProfileButton()}
										</Row>

										<View style={styles.dobContainer}>
											<Text>{`DOB: ${state.profile?.dob ? moment(state.profile.dob).format('MMM DD, yyyy') : '-'}`}</Text>
											{isBirthday && (
												<Image
													source={
														resources.icon.birthday
													}
													style={
														styles.birthdayProfile
													}
												/>
											)}
										</View>
										<Text>{`Gender: ${state.profile?.gender || '-'}`}</Text>
										<Spacer />
										<Text size="md" bold>
											Measurement Stats
										</Text>
										<Text>
											{`Height (cm): ${state.profile?.height || '-'}`}
										</Text>
										<Text>{`Weight (kg): ${state.profile?.weight || '-'}`}</Text>
										<Spacer />
										<Text size="md" bold>
											Emergency Contact
										</Text>
										<Text>{`Name: ${state.profile?.emergency_contact_name || '-'}`}</Text>
										<Row>
											<Text>Mobile Number: </Text>
											<TouchableOpacity
												onPress={() =>
													handlePressPhone(
														state.profile
															?.emergency_contact_number as string,
													)
												}
											>
												<Row align="center">
													<Icon
														name="phone"
														color={
															config.colors.info
														}
														style={{
															marginRight:
																config.metrics
																	.sm,
														}}
													/>
													<Text color="info">
														{state.profile
															?.emergency_contact_number ||
															'-'}
													</Text>
												</Row>
											</TouchableOpacity>
										</Row>
										<Spacer />
										<Text size="md" bold>
											{`Memberships (${state.profile?.memberships.length})`}
										</Text>
										<View
											style={{
												marginBottom: config.metrics.sm,
											}}
										/>
										{state.profile?.memberships.length ===
										0 ? (
											<View
												style={{
													height: config.metrics.xl,
													...layout.flex_1,
													...layout.justifyCenter,
												}}
											>
												<Text>No memberships</Text>
											</View>
										) : (
											state.profile?.memberships.map(
												(item, index) => {
													let bgColor: string =
														config.colors.danger;
													if (
														item.status === 'active'
													)
														bgColor =
															config.colors
																.success;
													if (
														item.status ===
														'pending'
													)
														bgColor =
															config.colors
																.orange;
													return (
														<TouchableOpacity
															key={index}
															disabled={!isOwner}
															onPress={() => {
																setVisible(
																	false,
																);
																navigate(
																	'Subscription',
																	{
																		updateAttendanceProfile:
																			updateData,
																		fromAttendance:
																			true,
																	},
																);
															}}
														>
															<Card
																key={index}
																elevated
															>
																<Row>
																	<Text
																		numberOfLines={
																			2
																		}
																		style={
																			styles.membershipCon
																		}
																	>
																		{
																			item.name
																		}
																	</Text>
																	<View
																		style={
																			styles.status
																		}
																	>
																		<View
																			style={[
																				styles.statusContainer,
																				{
																					backgroundColor:
																						bgColor,
																				},
																			]}
																		>
																			<Text
																				size="xs"
																				color="light"
																				bold
																			>
																				{item.status.toUpperCase()}
																			</Text>
																		</View>
																	</View>
																</Row>
															</Card>
														</TouchableOpacity>
													);
												},
											)
										)}
									</View>
								)}
								{activeTab === 'health' &&
									(state.health?.has_permission ? (
										<ScrollView style={styles.scrollHeight}>
											<Row spacing="space-between">
												<Text size="md" bold>
													Allergies
												</Text>
												{isOwner &&
													renderEditHealthButton()}
											</Row>
											<View
												style={{
													margin: config.metrics.xs,
												}}
											/>
											{state.health?.allergies.length ===
											0 ? (
												<View
													style={{
														height: config.metrics
															.xl,
														...layout.flex_1,
														...layout.justifyCenter,
													}}
												>
													<Text>
														No allergies reported
													</Text>
												</View>
											) : (
												state.health?.allergies.map(
													item => (
														<Card
															elevated
															key={item.id}
														>
															<Text>{`Allergy: ${item.allergy}`}</Text>
															{item.requires_treatment_plan && (
																<Row align="center">
																	{renderExclamation()}
																	<Text>
																		Requires
																		treatment
																		plan
																	</Text>
																</Row>
															)}

															<Text>{`Notes: ${item.notes}`}</Text>
														</Card>
													),
												)
											)}
											<Spacer />
											<Text size="md" bold>
												Existing Medical Conditions
											</Text>
											<View
												style={{
													margin: config.metrics.xs,
												}}
											/>
											{state.health
												?.pre_existing_conditions
												.length === 0 ? (
												<View
													style={{
														height: config.metrics
															.xl,
														...layout.flex_1,
														...layout.justifyCenter,
													}}
												>
													<Text>
														No medical condition
														reported
													</Text>
												</View>
											) : (
												state.health?.pre_existing_conditions.map(
													item => (
														<Card
															elevated
															key={item.id}
														>
															<Text>
																{`Condition: ${item.condition}`}
															</Text>
															{item.advised_to_limit_activities && (
																<Row align="center">
																	{renderExclamation()}
																	<Text>
																		Advised
																		to limit
																		activities
																	</Text>
																</Row>
															)}
															<Text>
																{`Notes and limitations: ${item.notes_and_limitations}`}
															</Text>
														</Card>
													),
												)
											)}
											<Spacer />
											<Text size="md" bold>
												Prescription Medications
											</Text>
											<View
												style={{
													margin: config.metrics.xs,
												}}
											/>
											{state.health?.prescriptions
												.length === 0 ? (
												<View
													style={{
														height: config.metrics
															.xl,
														...layout.flex_1,
														...layout.justifyCenter,
													}}
												>
													<Text>
														No medication reported
													</Text>
												</View>
											) : (
												state.health?.prescriptions.map(
													item => (
														<Card
															elevated
															key={item.id}
														>
															<Text>
																{`Medication: ${item.medication}`}
															</Text>
															{item.advised_to_limit_activities && (
																<Row align="center">
																	{renderExclamation()}
																	<Text>
																		Advised
																		to limit
																		activities
																	</Text>
																</Row>
															)}
															<Text>
																{`Notes and limitations: ${item.notes_and_limitations}`}
															</Text>
														</Card>
													),
												)
											)}
										</ScrollView>
									) : (
										renderNoAccess()
									))}
								{activeTab === 'injury' &&
									(state.injuries?.has_permission ? (
										<ScrollView
											style={
												injuryScrollHeight as ViewStyle
											}
										>
											<Row spacing="space-between">
												<Text bold size="md">
													Injuries
												</Text>

												{isOwner &&
													renderEditHealthButton()}
											</Row>
											<Spacer />
											{state.injuries?.injuries.length ===
											0 ? (
												<View
													style={[
														layout.justifyCenter,
													]}
												>
													<Text>
														No injuries reported
													</Text>
												</View>
											) : (
												state.injuries?.injuries.map(
													item => (
														<Card
															elevated
															key={item.id}
														>
															<Text>
																{`Body Part: ${item.body_part}`}
															</Text>
															<Text>
																{`Body Side: ${item.body_side}`}
															</Text>
															<Text>
																{`Description: ${item.description}`}
															</Text>
															<Text>
																{`When Injury Occurred: ${item.when_injury_occured}`}
															</Text>
															{item.advised_to_limit_activities && (
																<Row>
																	{renderExclamation()}
																	<Text>
																		Advised
																		to limit
																		activities
																	</Text>
																</Row>
															)}
															<Text>
																{`Activity Limitations: ${item.activity_limitations}`}
															</Text>
														</Card>
													),
												)
											)}
										</ScrollView>
									) : (
										renderNoAccess()
									))}
								{activeTab === 'payment' && (
									<View>
										<Text bold size="md">
											{`Failed Invoices (${state.failedInvoices?.length})`}
										</Text>
										<Spacer />
										{state.failedInvoices?.map(item => {
											return (
												<Card elevated key={item.id}>
													<Row align="center">
														<View
															style={
																layout.flex_1
															}
														>
															<Text>
																{item.name}
															</Text>
															<Text size="xs">
																{moment(
																	item.created_at,
																).format(
																	Constant.DEFAULT_DATE_FORMAT,
																)}
															</Text>
														</View>
														<View
															style={
																styles.amountCon
															}
														>
															<Text>
																$
																{(
																	item.amount /
																	100
																).toFixed(2)}
															</Text>
															{item.apply_transaction_fees_to_member && (
																<Text size="xs">
																	+ fees
																</Text>
															)}
														</View>
													</Row>
												</Card>
											);
										})}
									</View>
								)}
							</ScrollView>
							{isOwner && (
								<View
									style={{
										marginTop: config.metrics.sm,
									}}
								>
									<Text size="xs" center color="info">
										This information is only visible by you
										and select gym staff
									</Text>
								</View>
							)}
						</>
					)}
				</>
			</UserInfoModal>
			<UserInfoModal
				visible={visibileAvatar}
				onDismiss={() => setVisibleAvatar(false)}
			>
				<View>
					<View style={styles.infoAvatarCon}>
						{renderCloseButton('member')}
						<View style={styles.infoAvatar}>
							<Avatar source={avatar} size={250} />
						</View>
					</View>
					<Spacer size="lg" />
					<Text size="lg" bold numberOfLines={2} center>
						{name}
					</Text>
				</View>
			</UserInfoModal>
		</>
	);
};

export default AttendanceItem;

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: metrics.sm,
	},
	actionButtonContainer: {
		justifyContent: 'center',
		flex: 0.2,
	},
	avatarStyle: {
		borderRadius: 35,
		overflow: 'hidden',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: fonts.colors.lightgrey,
	},
	infoAvatarCon: {
		height: 115,
	},
	infoAvatar: {
		borderRadius: 130,
		top: -140,
		backgroundColor: 'white',
		alignSelf: 'center',
	},
	infoDetailsContainer: {
		alignItems: 'center',
		marginBottom: config.metrics.rg,
	},
	avatarCon: {
		width: 36,
		alignItems: 'center',
	},
	detailsContainer: {
		paddingHorizontal: metrics.sm,
		paddingVertical: metrics.sm,
		alignItems: 'center',
	},
	iconTabContainer: {
		flexDirection: 'row',
		marginTop: config.metrics.rg,
		justifyContent: 'space-around',
		marginHorizontal: 20,
	},
	infoTabContainer: {
		paddingHorizontal: config.metrics.rg,
		marginTop: config.metrics.md,
		height: '48%',
	},
	listInfoIconsCon: {
		flexDirection: 'row',
		width: '28%',
		paddingLeft: 5,
		alignItems: 'center',
	},
	listInfoIcon: {
		marginHorizontal: 2,
		alignItems: 'center',
	},
	contactPhonePlaceHolder: {
		height: 17,
	},
	attendanceListNameCon: {
		width: '60%',
	},
	birthday: {
		width: 16,
		height: 16,
		top: -2,
	},
	birthdayProfile: {
		width: 15,
		height: 15,
		marginLeft: 5,
	},
	moreCon: {
		top: 6,
		left: -4,
	},
	dobContainer: {
		flexDirection: 'row',
	},
	amountCon: {
		flex: 0.3,
		alignItems: 'flex-end',
	},
	scrollHeight: {
		height: '48%',
	},
	exclamationIcon: {
		left: -5,
		width: 10,
	},
	statusContainer: {
		borderRadius: 5,
		width: 75,
		padding: 2,
		alignItems: 'center',
	},
	status: {
		flex: 1,
		alignItems: 'flex-end',
	},
	membershipCon: {
		flex: 2.5,
	},
	editButtonContainer: {
		width: 30,
		height: 20,
		alignSelf: 'flex-end',
		justifyContent: 'center',
	},
	injuriesText: {
		flex: 1.5,
		textAlign: 'right',
	},
	closeButton: {
		alignSelf: 'flex-end',
		top: -5,
		left: 5,
	},
});
