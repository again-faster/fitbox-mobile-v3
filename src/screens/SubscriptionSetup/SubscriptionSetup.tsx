import useAuth from '@/auth/hooks/useAuth';
import { Button, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import {
	getSubscriptionInfo,
	getSubscriptionProducts,
	getUserSubscriptionProducts,
	saveSubscription,
} from '@/services/subscription';
import { getUserGymInfo, getUserProfile } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	MainTabScreenProps,
	SubscriptionSetupParams,
} from '@/types/navigation';
import {
	GetUserSubscriptionProductsType,
	LoginResponseSchemaType,
} from '@/types/schemas/response';
import {
	SaveSubscriptionPayloadType,
	SubscriptionType,
	UserSubscriptionProductsType,
} from '@/types/schemas/subscription';
import { Constant, Say } from '@/utils';
import { PaymentGateways } from '@/utils/Enum';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { isEmpty, isNil } from 'lodash';
import moment from 'moment';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { TextInput } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/FontAwesome5';
import SubscriptionCard from './components/SubscriptionCard';
import SubscriptionItem from './components/SubscriptionItem';

type StateProps = {
	currentSubscription: SubscriptionType | null;
	loadingPaymentDetails: boolean;
	selectedProductId: number | null;
	startDate: string;
	showDatePicker: boolean;
	processing: boolean;
	isBuyNow: boolean;
	sessionId?: number;
};

const iosVersion = parseInt(Platform.Version as string, 10);
const initialStartDate = moment().format(Constant.DEFAULT_DATE_FORMAT);

const SubscriptionSetup = ({ route, navigation }: MainTabScreenProps) => {
	const params = route.params as SubscriptionSetupParams;

	const fromSubscription = params?.fromSubscription ?? false;
	const setupSubscription = params?.setupSubscription ?? false;
	const onSuccessPurchase = params?.onSuccessPurchase ?? (() => {});
	const sessionDate = params?.sessionDate ?? initialStartDate;
	const sessionId = params?.sessionId ?? undefined;

	const {
		fromAcceptInvite,
		setupSubscriptionId,
		setAppState,
		loggedInUser,
		setLoggedInUser,
	} = useStore(state => ({
		fromAcceptInvite: state.fromAcceptInvite,
		setupSubscriptionId: state.setupSubscriptionId,
		setAppState: state.setAppState,
		clearClasses: state.clearClasses,
		loggedInUser: state.loggedInUser,
		setLoggedInUser: state.setLoggedInUser,
	}));
	const { user, updateUser } = useAuth();
	const [data, setData] = useState<GetUserSubscriptionProductsType>();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [state, setState] = useState<StateProps>({
		currentSubscription: null,
		loadingPaymentDetails: true,
		selectedProductId: null,
		startDate: sessionDate || initialStartDate,
		showDatePicker: false,
		processing: false,
		isBuyNow: !!sessionId,
		sessionId,
	});
	const [hasPaymentDetails, setHasPaymentDetails] = useState<boolean>(false);
	const hasPreviousSubscriptions = user?.user_data.has_previous_subscriptions;
	const userState = loggedInUser as LoginResponseSchemaType;

	useLayoutEffect(() => {
		let navOptions: Record<string, unknown> = {
			title: 'Membership',
			headerLeft: () => null,
		};

		if (setupSubscription) {
			navOptions = {
				title: 'Setup Subscription',
			};
		} else if (fromSubscription) {
			navOptions = {
				title: 'New Membership',
			};
		} else if (state.isBuyNow) {
			navOptions = {
				title: 'Buy Now',
			};
		}

		navigation.setOptions(navOptions);
	}, []);

	useEffect(() => {
		void (async () => {
			setIsLoading(true);

			if (!fromSubscription && fromAcceptInvite) {
				const subInfoRes = await getSubscriptionInfo();
				if (subInfoRes.current.length) {
					const currentSubscription =
						subInfoRes.current.reverse()[0] as SubscriptionType;
					setState({
						...state,
						currentSubscription,
					});
					setIsLoading(false);

					return;
				}
			}

			const res =
				state.isBuyNow || hasPreviousSubscriptions
					? await getUserSubscriptionProducts(sessionId)
					: await getSubscriptionProducts();

			if (!res.error && res.data.length) {
				setData(res);
				setIsLoading(false);

				let selectedProductId;

				if (state.isBuyNow && res.data.length === 1) {
					selectedProductId = res.data[0]!.id;
				} else {
					selectedProductId = res.data.some(
						p => p.id === setupSubscriptionId,
					)
						? setupSubscriptionId
						: null;
				}

				if (selectedProductId) {
					setState({ ...state, selectedProductId });
				}
			} else if (
				fromSubscription ||
				state.isBuyNow ||
				hasPreviousSubscriptions
			) {
				void Say.okThen(
					'There are no available subscriptions at the moment.',
					'Sorry',
				).then(() => navigation.pop());
			} else {
				handleSkip();
			}

			const userProfileRes = await getUserProfile();
			if (userProfileRes.user_data.has_payment_details) {
				setHasPaymentDetails(
					!!userProfileRes.user_data.has_payment_details,
				);
			}

			setState({ ...state, loadingPaymentDetails: false });
		})();
	}, []);

	const handleSkip = (isFree = false, navigateToStartup = true) => {
		if (fromSubscription && navigateToStartup) {
			navigation.pop();
		}

		const session = user?.user_data;

		if (session) {
			session.show_subscription_form = false;
			session.show_payment_form = Boolean(!isFree);
			session.has_paid_subscriptions = Boolean(!isFree);

			setAppState('fromAcceptInvite', false);
			updateUser(session);
			if (navigateToStartup) navigate('Startup');
		}
	};

	const handleSelectSubscription = (selectedProductId: number) => {
		setState({ ...state, selectedProductId });
	};

	const handleSubmit = async () => {
		setState({ ...state, processing: true });
		const { selectedProductId, startDate } = state;
		const product = data?.data.find(p => p.id === selectedProductId);

		const submitStartDate = moment(startDate).format(
			Constant.DEFAULT_DATE_FORMAT,
		);
		const recurringStartDate = moment(submitStartDate)
			.add(1, 'day')
			.format(Constant.DEFAULT_DATE_FORMAT);

		const payload = {
			customer_id: user?.user_data.user_id,
			product_id: product?.id,
			product_type: product?.type,
			first_billing_date: recurringStartDate,
			recurringStartDate,
			price_in_cents: product?.price_in_cents,
			set_up_price_in_cents: product?.set_up_price_in_cents,
			trial_price_in_cents: product?.trial_price_in_cents,
			start_date: submitStartDate,
			from_signup: !fromSubscription,
		};

		try {
			const res = await saveSubscription(
				payload as SaveSubscriptionPayloadType,
			);

			if (res.error) {
				Say.err(res.message);
			} else {
				SimpleToast.show(
					state.isBuyNow
						? 'Booked successfully!'
						: 'Subscription setup successful',
					SimpleToast.SHORT,
				);

				setAppState('setupSubscriptionId', null);

				getUserGymInfo()
					.then(gymInfoRes => {
						setLoggedInUser({
							...userState,
							user_data: {
								...userState.user_data,
								has_previous_subscriptions:
									gymInfoRes.user_data
										.has_previous_subscriptions,
							},
						});
					})
					.catch(error => Say.err(error as ICatchError));

				// purchase now callback
				// go back to subscription screen if from subscription
				let popScreen = false;

				if (state.isBuyNow) {
					onSuccessPurchase?.();
					popScreen = true;
				}

				if (fromSubscription) {
					popScreen = true;
				}

				if (popScreen) navigation.pop();
			}

			setState({ ...state, processing: false });

			// handle skip
			if (!state.isBuyNow) {
				handleSkip(
					Boolean(product?.type === 'free'),
					!fromSubscription,
				);
			}
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log('error: ', e);
		}
	};

	const renderSubscriptionSummary = (subscription: SubscriptionType) => {
		const startDate = moment(subscription.start_date).format(
			'MMM DD, YYYY',
		);
		const nextPaymentDate = moment(subscription.first_billing_date).format(
			'MMM DD, YYYY',
		);

		return (
			<ScrollView>
				<SubscriptionCard data={subscription} />

				<Spacer />

				<Text center>Your subscription will start on</Text>
				<Text size="lg" center color="info">
					{startDate}
				</Text>

				<Spacer />

				<Text center>Next Payment Date will be on</Text>
				<Text size="lg" center color="info">
					{nextPaymentDate}
				</Text>

				<Spacer size="lg" />

				<Button
					title="I understand"
					sm
					style={styles.buttonStyle}
					onPress={() => handleSkip(subscription.type === 'free')}
				/>
			</ScrollView>
		);
	};

	const renderSelectSubscriptionView = (
		products: UserSubscriptionProductsType[],
	) => {
		return (
			<>
				<View
					style={[
						layout.flex_1,
						{ paddingVertical: config.metrics.md },
					]}
				>
					<Text size="lg" center style={styles.headerStyle}>
						Which membership option are you wanting to sign-up for?
					</Text>
					<Spacer size="lg" />
					{state.loadingPaymentDetails ? (
						<View style={styles.loader}>
							<ActivityIndicator
								size="large"
								color={config.colors.brand}
							/>
						</View>
					) : (
						<ScrollView
							contentContainerStyle={{
								paddingHorizontal: config.metrics.lg,
							}}
						>
							{products.map(
								({
									id,
									name,
									description,
									price_in_cents,
									trial_price_in_cents,
									recurring_interval,
									payment_gateway,
									type,
									apply_transaction_fees_to_member,
								}) => {
									const price = price_in_cents / 100;
									const trialPrice =
										trial_price_in_cents / 100;

									const subPrice =
										recurring_interval === 1
											? trialPrice
											: price;

									const isFreeType = type === 'free';
									const hasValidPaymentDetails =
										hasPaymentDetails || !fromSubscription;

									const isEnabled =
										Object.values(PaymentGateways).includes(
											payment_gateway as PaymentGateways,
										) ||
										isFreeType ||
										hasValidPaymentDetails;

									const onPress = isEnabled
										? () => handleSelectSubscription(id)
										: () =>
												Alert.alert(
													'Oops!',
													'You don\u0027t have payment details yet. Please add payment details first',
													[
														{
															text: 'Add payment details',
															onPress: () =>
																navigation.navigate(
																	'PaymentInformation',
																),
														},
														{
															text: 'Cancel',
															style: 'cancel',
														},
													],
													{ cancelable: true },
												);

									return (
										<SubscriptionItem
											key={id}
											title={name}
											price={subPrice}
											description={description}
											disabled={!isEnabled}
											plusFees={
												apply_transaction_fees_to_member
											}
											onPress={onPress}
										/>
									);
								},
							)}
						</ScrollView>
					)}
				</View>
				{!fromSubscription && !state.isBuyNow && (
					<TouchableOpacity
						onPress={() => handleSkip()}
						style={{ paddingVertical: config.metrics.md }}
					>
						<Text size="lg" color="darkgray" center>
							None of the above
						</Text>
					</TouchableOpacity>
				)}
			</>
		);
	};

	const renderSelectStartDate = () => {
		const { showDatePicker, startDate, processing, selectedProductId } =
			state;
		const datePickerVal = new Date(startDate);
		const minDate = new Date(initialStartDate);
		const formattedDate = moment(startDate).format(
			Constant.DEFAULT_DATE_FORMAT,
		);
		const selectedProduct = data?.data.find(
			p => p.id === selectedProductId,
		);

		return (
			<ScrollView>
				<DateTimePicker
					mode="date"
					date={datePickerVal}
					isVisible={showDatePicker}
					onConfirm={date =>
						setState({
							...state,
							startDate: moment(date).format(
								Constant.DEFAULT_DATE_FORMAT,
							),
							showDatePicker: false,
						})
					}
					onCancel={() =>
						setState({ ...state, showDatePicker: false })
					}
					minimumDate={minDate}
					pickerContainerStyleIOS={styles.pickerContaineriOSStyle}
				/>

				<SubscriptionCard
					data={selectedProduct as UserSubscriptionProductsType}
				/>

				<View
					style={[
						styles.selectStartDateViewStyle,
						// eslint-disable-next-line react-native/no-inline-styles
						{ display: !state.isBuyNow ? 'flex' : 'none' },
					]}
				>
					<Spacer size="lg" />

					<Text size="md" style={styles.headerStyle} center>
						When do you want to start your Membership?
					</Text>
					<Text
						size="sm"
						style={styles.headerStyle}
						color="darkgray"
						center
					>
						(note: you won’t be able to attend Sessions until your
						membership starts){' '}
					</Text>
					<Spacer size="lg" />
					<TouchableOpacity
						onPress={() =>
							setState({ ...state, showDatePicker: true })
						}
						style={styles.calendarIconStyle}
					>
						<Row align="center">
							<TextInput
								label="Start Date"
								value={formattedDate}
								style={[
									styles.input,
									layout.fontMontserratRegular,
								]}
								autoCapitalize="words"
								underlineColor="white"
								theme={{
									colors: {
										primary: config.backgrounds.mute,
									},
								}}
								disabled
								allowFontScaling={false}
							/>
							<Spacer horizontal />
							<Icon
								name="calendar-alt"
								color={config.backgrounds.darkgray}
								size={config.metrics.lg}
								style={styles.iconStyle}
							/>
						</Row>
					</TouchableOpacity>
				</View>

				<Spacer size="lg" />

				<Button
					title={state.isBuyNow ? 'Purchase now' : 'Submit'}
					sm
					style={styles.buttonStyle}
					labelStyle={styles.buttonLabelStyle}
					onPress={() => void handleSubmit()}
					loading={processing}
					disabled={processing}
				/>

				<Spacer />

				{isEmpty(setupSubscriptionId) && !state.isBuyNow && (
					<TouchableOpacity
						onPress={() =>
							setState({ ...state, selectedProductId: null })
						}
					>
						<Text size="rg" color="darkgray" center>
							Go back
						</Text>
					</TouchableOpacity>
				)}
			</ScrollView>
		);
	};

	const renderComponent = () => {
		if (state.currentSubscription) {
			return renderSubscriptionSummary(state.currentSubscription);
		}
		if (isNil(state.selectedProductId)) {
			return renderSelectSubscriptionView(
				data?.data as UserSubscriptionProductsType[],
			);
		}
		return renderSelectStartDate();
	};

	return isLoading ? (
		<View style={styles.loader}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<View style={layout.flex_1}>{renderComponent()}</View>
	);
};

const styles = StyleSheet.create({
	headerStyle: {
		width: '70%',
		alignSelf: 'center',
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
	},
	buttonStyle: {
		...layout.shadowLight,
		width: '60%',
		backgroundColor: config.colors.brand,
		alignSelf: 'center',
		marginVertical: config.metrics.lg,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 4,
		borderColor: config.borders.colors.dark,
		backgroundColor: 'transparent',
	},
	buttonLabelStyle: {
		color: config.backgrounds.light,
		...layout.flex_1,
	},
	pickerContaineriOSStyle: {
		paddingLeft: iosVersion >= 14 ? 18 : 0,
	},
	iconStyle: {
		justifyContent: 'center',
	},
	selectStartDateViewStyle: {
		alignItems: 'center',
		flex: 1,
	},
	calendarIconStyle: {
		width: '80%',
	},
});

export default SubscriptionSetup;
