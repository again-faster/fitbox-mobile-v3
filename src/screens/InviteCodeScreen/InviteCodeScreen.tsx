import useAuth from '@/auth/hooks/useAuth';
import { Avatar, Button, Row, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { acceptInvite, validateInvite } from '@/services/auth';
import { getSubscriptionInfo } from '@/services/subscription';
import { config } from '@/theme/_config';
import { InviteParams, MainTabScreenProps } from '@/types/navigation';
import {
	UserDetailsType,
	UserSchemaType,
	ValidateInviteCodeDataType,
	ValidateInviteCodeResponseType,
} from '@/types/schemas/user';
import { Constant, Func, Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { capitalize, isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { HelperText, TextInput as PaperInput } from 'react-native-paper';

type State = {
	isLoggedIn: boolean;
	code: string;
	details: ValidateInviteCodeDataType | null;
	inputFields: typeof formFields;
	fields: UserDetailsType;
	fieldsError: UserDetailsType;
	loading: boolean;
	processing: boolean;
};

/**
 * @static formFields
 * @summary Fields to be used
 */
const formFields = [
	{ id: 'email', label: 'Email', autoCapitalize: 'none', disabled: true },
	{
		id: 'firstname',
		label: 'First Name',
		autoCapitalize: 'none',
		disabled: true,
	},
	{
		id: 'lastname',
		label: 'Last Name',
		autoCapitalize: 'none',
		disabled: true,
		marginBottom: config.metrics.xl,
	},
	{ id: 'password', label: 'Password', autoCapitalize: 'none', secure: true },
	{
		id: 'confirm_password',
		label: 'Confirm Password',
		autoCapitalize: 'none',
		secure: true,
	},
];

/**
 * @static passwordFields
 * @summary Password fields to be used
 */
const passwordFields = ['password', 'confirm_password'];

const skipPaymentGateways = ['cash', 'bank_transfer'];

const InviteCodeScreen = ({ navigation, route }: MainTabScreenProps) => {
	const { user, signOut, updateUser, signIn } = useAuth();
	const { setAppState, clearClasses, clearFilters, clearStates } = useStore(
		state => ({
			setAppState: state.setAppState,
			clearClasses: state.clearClasses,
			clearStates: state.clearAppState,
			clearFilters: state.clearFilters,
		}),
	);

	const [state, setState] = useState<State>({
		isLoggedIn: false,
		code: (route.params as InviteParams)?.inviteCode || '',
		details: null,
		inputFields: [],
		fields: {} as UserDetailsType,
		fieldsError: {} as UserDetailsType,
		loading: false,
		processing: false,
	});

	useEffect(() => {
		const isLoggedIn = !isEmpty(user);

		const fields = {} as UserDetailsType;
		const inputFields = [] as typeof formFields;

		formFields.forEach(field => {
			if (isLoggedIn && passwordFields.includes(field.id)) {
				return;
			}

			fields[field.id as keyof UserDetailsType] = '';

			inputFields.push(field);
		});

		setState(prevState => ({
			...prevState,
			isLoggedIn,
			fields,
			inputFields,
		}));

		if (!isEmpty(state.code)) {
			void onValidateCode();
		}
	}, []);

	const onSubmit = async () => {
		const hasError = checkForEmptyFields();
		if (hasError) return;

		try {
			setState(prevState => ({ ...prevState, processing: true }));
			const { fields, code } = state;

			const payload = { ...fields, code };

			const res = await acceptInvite(payload);

			if (!res.error) {
				if (res.data.accepted) {
					Say.okThen('Successfully Registered')
						.then(() => void onSubmitCallback())
						.catch(error => Say.err(error as ICatchError));
				}
			}
		} catch (error) {
			handleErrorMessage(error as string);
		} finally {
			setState(prevState => ({ ...prevState, processing: false }));
		}
	};

	const onSubmitCallback = async () => {
		clearStatesFn();

		try {
			const { isLoggedIn } = state;

			setAppState('fromAcceptInvite', true);
			if (isLoggedIn) {
				const subInfoRes = await getSubscriptionInfo();
				let showPaymentForm = false;
				let showSubscriptionForm = true;
				const userData = user?.user_data as UserSchemaType;

				const hasCurrentSubscription = subInfoRes.current.length > 0;
				if (hasCurrentSubscription) {
					showSubscriptionForm = false;

					const isShowForm = !skipPaymentGateways.includes(
						subInfoRes.current[0]?.payment_gateway as string,
					);
					if (isShowForm) showPaymentForm = true;
				}

				userData.show_payment_form = showPaymentForm;
				userData.show_subscription_form = showSubscriptionForm;
				userData.waiver_accepted = false;

				updateUser(userData);
			} else {
				const { email, password } = state.fields;
				signIn(email, password as string)
					.then(res => {
						if (res) navigation.navigate('Startup');
					})
					.catch(() => {
						Say.err(
							'There was an error signing in. Please try again.',
						);
					});
			}
		} catch (error) {
			handleErrorMessage(error as string);
		}
	};

	const onValidateCode = async () => {
		// Check if the code is a gym code
		if (Func.isGymCode(state.code)) {
			Alert.alert(
				'Invalid Code',
				'Seems that you are trying to use a gym code. Please use the gym code on the registration form.',
				[
					{
						text: 'Ok',
						onPress: () =>
							navigate('SignUp', { gymCode: state.code }),
					},
					{ text: 'Cancel', style: 'cancel' },
				],
				{ cancelable: true },
			);

			return;
		}

		try {
			setState(prevState => ({ ...prevState, loading: true }));

			let valid = false;

			const res = await validateInvite(state.code);

			if (!res.error) {
				if (res.data.exists && res.data.valid) {
					const { fields, isLoggedIn } = state;

					Object.keys(
						(res as ValidateInviteCodeResponseType).data
							.userDetails,
					).forEach(key => {
						fields[key as keyof UserDetailsType] = (
							res as ValidateInviteCodeResponseType
						).data.userDetails[
							key as keyof UserDetailsType
						] as string;
					});

					if (isLoggedIn) {
						if (fields.email !== user?.user_data.email) {
							Alert.alert(
								'Invalid invite code',
								'Unable to Accept Invite for Another User. \n\nPlease logout to continue',
								[
									{
										text: 'Logout',
										onPress: () => handleLogout(),
									},
									{
										text: 'Cancel',
										style: 'cancel',
									},
								],
								{ cancelable: true },
							);

							return;
						}
					}

					setState(prevState => ({
						...prevState,
						details: (res as ValidateInviteCodeResponseType).data,
						fields,
					}));
					valid = true;
				}
			}

			if (!valid) throw new Error(res.message);
		} catch (error) {
			handleErrorMessage(error as string);
		} finally {
			setState(prevState => ({ ...prevState, loading: false }));
		}
	};

	const validatePassword = (password: string) => {
		// Check for each of the four character types
		const hasLowercase = /[a-z]/.test(password);
		const hasUppercase = /[A-Z]/.test(password);
		const hasNumber = /\d/.test(password);
		// eslint-disable-next-line no-useless-escape
		const hasSymbol = /[!@#$%^&*()_+={}\[\]:;"'|,.<>?/-]/.test(password);

		// Count how many character types are present
		const conditionsMet = [
			hasLowercase,
			hasUppercase,
			hasNumber,
			hasSymbol,
		].filter(Boolean).length;

		if (
			conditionsMet >= 3 &&
			password.length >= 8 &&
			password.length <= 256
		) {
			return true;
		}
		return false;
	};

	const checkForEmptyFields = () => {
		const { fields, fieldsError, isLoggedIn } = state;
		let hasError = false;

		Object.keys(fields).forEach(key => {
			if (isEmpty(fields[key as keyof UserDetailsType])) {
				fieldsError[key as keyof UserDetailsType] =
					'This field is required';
				hasError = true;
			}
		});

		if (!isLoggedIn && fields.password) {
			if (!validatePassword(fields.password)) {
				fieldsError.password =
					'Password must be between 8-256 characters and include at least three of the following: lowercase, uppercase, numbers, and symbols.';
				hasError = true;
			}

			if (fields.password !== fields.confirm_password) {
				fieldsError.confirm_password = 'Passwords do not match';
				hasError = true;
			}
		}

		setState(prevState => ({ ...prevState, fieldsError }));

		return hasError;
	};
	const clearStatesFn = () => {
		clearClasses();
		clearFilters();
		clearStates();
	};

	const handleTextOnChange = (id: keyof UserDetailsType, text: string) => {
		const { fieldsError, fields } = state;

		delete fieldsError[id];

		fields[id] = text;

		setState(prevState => ({ ...prevState, fieldsError, fields }));
	};

	const handleErrorMessage = (error: string) => {
		Say.warn(error ? capitalize(error) : 'Something went wrong');
	};

	const handleLogout = () => {
		signOut();
		navigation.reset({
			index: 0,
			routes: [{ name: 'Landing' }],
		});
	};

	const handleOnChange = (code: string) =>
		setState(prevState => ({ ...prevState, code }));

	const renderCodeForm = () => {
		return (
			<View style={style.codeFormContainer}>
				<View style={style.codeFormMainContainer}>
					<Text>Enter invitation code below</Text>
					<Spacer />
					<View style={style.codeInputContainer}>
						<TextInput
							value={state.code}
							textAlign="center"
							style={style.codeInput}
							onChangeText={code => handleOnChange(code)}
							allowFontScaling={false}
						/>
					</View>
					<Spacer />
					<Button
						title="Submit"
						sm
						style={style.submitButton}
						labelStyle={style.submitButtonLabel}
						loading={state.loading}
						onPress={() => void onValidateCode()}
					/>
				</View>
			</View>
		);
	};

	const renderUserForm = () => {
		const {
			details,
			fields,
			processing,
			fieldsError,
			inputFields,
			isLoggedIn,
		} = state;

		return (
			<ScrollView contentContainerStyle={style.userFormContainer}>
				<View style={style.userFormGymContainer}>
					<Row align="center">
						<Avatar
							size={config.metrics.xl + 10}
							source={details?.gymDetails.small_logo}
						/>
						<Spacer horizontal />
						<View style={style.userFormGymContainer}>
							<Text size="xl">{details?.gymDetails.name}</Text>
							<Text color="darkgray">
								Please fill out details below
							</Text>
						</View>
					</Row>
				</View>
				<Spacer />
				{inputFields.map(field => (
					<>
						<View
							key={field.label}
							style={{ marginBottom: field.marginBottom ?? 0 }}
						>
							<PaperInput
								key={field.id}
								label={field.label}
								value={
									fields[field.id as keyof UserDetailsType]
								}
								onChangeText={text =>
									handleTextOnChange(
										field.id as keyof UserDetailsType,
										text,
									)
								}
								autoComplete="off"
								style={style.input}
								autoCapitalize={
									field.autoCapitalize as
										| 'none'
										| 'sentences'
										| 'words'
										| 'characters'
										| undefined
								}
								underlineColor="white"
								secureTextEntry={field.secure}
								disabled={processing || field.disabled}
								error={
									!isEmpty(
										fieldsError[
											field.id as keyof UserDetailsType
										],
									)
								}
								allowFontScaling={false}
							/>
						</View>
						{fieldsError[field.id as keyof UserDetailsType] && (
							<HelperText
								key={field.id}
								type="error"
								visible
								allowFontScaling={false}
							>
								{fieldsError[field.id as keyof UserDetailsType]}
							</HelperText>
						)}
					</>
				))}

				<Spacer />

				<View style={style.submitButtonContainer}>
					<Button
						sm
						title={isLoggedIn ? 'Accept' : 'Sign Up'}
						style={style.submitButton}
						labelStyle={style.submitButtonLabel}
						onPress={() => void onSubmit()}
					/>
				</View>
			</ScrollView>
		);
	};

	return state.details ? renderUserForm() : renderCodeForm();
};

const style = StyleSheet.create({
	codeFormContainer: {
		flex: 1,
		paddingVertical: config.metrics.lg,
		paddingHorizontal: config.metrics.xl,
		justifyContent: 'space-evenly',
	},
	codeFormMainContainer: {
		alignItems: 'center',
	},
	codeInputContainer: {
		minWidth: '50%',
		color: config.backgrounds.darkgray,
		borderColor: config.backgrounds.darkgray,
		borderWidth: 1,
		borderRadius: 4,
		flexDirection: 'row',
	},
	codeInput: {
		width: '100%',
		paddingVertical: Constant.IS_ANDROID ? 15 : 20,
	},
	userFormContainer: {
		padding: config.metrics.lg,
	},
	userFormGymContainer: {
		alignItems: 'center',
		flex: 1,
	},
	userFormGymDetails: {
		marginBottom: config.metrics.md,
		flex: 1,
	},
	input: {
		width: '100%',
		borderWidth: 1,
		borderRadius: 4,
		borderColor: '#f2f2f2',
		backgroundColor: 'transparent',
		marginTop: config.metrics.md,
	},
	submitButton: {
		marginTop: config.metrics.xl,
		width: '60%',
		backgroundColor: config.colors.brand,
	},
	submitButtonLabel: {
		color: config.fonts.colors.light,
	},
	submitButtonContainer: {
		alignItems: 'center',
	},
});

export default InviteCodeScreen;
