import useAuth from '@/auth/hooks/useAuth';
import {
	Avatar,
	Button,
	Card,
	KeyboardSpacer,
	Row,
	Spacer,
	Text,
} from '@/components/atoms';
import { BottomPanel, QRCamera } from '@/components/molecules';
import { checkEmail, register } from '@/services/auth';
import { getUserGymInfoV2 } from '@/services/users';
import { config } from '@/theme/_config';
import { ApplicationScreenProps, SignUpParams } from '@/types/navigation';
import { GymInfoType, MemberRolesType } from '@/types/schemas/gym';
import { Constant, Say } from '@/utils';
import { capitalize, isArray, isEmpty } from 'lodash';
import moment from 'moment';
import { RefObject, createRef, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	DimensionValue,
	Dimensions,
	Keyboard,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
	ViewStyle,
} from 'react-native';
import GoogleRecaptcha, {
	GoogleRecaptchaRefAttributes,
} from 'react-native-google-recaptcha';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { InputField } from './components';

type State = {
	allowEmail: boolean;
	validatingEmail: boolean | null;
	role: number | null;
	roleModal: boolean;
	roleModalTopHeight: DimensionValue;
	verified: boolean;
	useQR: boolean;
	code: string;
	gymInfo: GymInfoType | null;
	processing: boolean;
	proceed: boolean;
	fetching: boolean;
	fields: Fields | null;
	fieldsError: FormErrors;
	requiredFields: RequiredFields[];
	activeFieldInput: RequiredFields | null;
};

type Fields = {
	email: string;
	firstname: string;
	lastname: string;
	password: string;
	password_confirmation: string;
};

export type CustomFields = {
	dob: {
		type: string;
		label: string;
	};
	gender: {
		type: string;
		label: string;

		options: string[];
	};
};

type FormErrors = {
	[key: string]: string[];
};
type AutoCapitalizeType =
	| 'none'
	| 'sentences'
	| 'words'
	| 'characters'
	| undefined;

type RequiredFields = {
	autoCapitalize: AutoCapitalizeType;
	data?: {
		type: string;
		label: string;
		options?: string[];
	};
	id: string;
	label: string;
	type?: string;
	secure?: boolean;
};

interface ModalComponent {
	measureWindow: (callback: unknown) => void;
}

const DEVICEHEIGHT = Dimensions.get('screen').height;

const SIGNUP_INPUT_FIELDS = [
	{ id: 'email', label: 'Email', autoCapitalize: 'none' },
	{ id: 'firstname', label: 'First Name', autoCapitalize: 'words' },
	{ id: 'lastname', label: 'Last Name', autoCapitalize: 'words' },
	{ id: 'password', label: 'Password', autoCapitalize: 'none', secure: true },
	{
		id: 'password_confirmation',
		label: 'Confirm Password',
		autoCapitalize: 'none',
		secure: true,
	},
];

const SIGNUP_CUSTOM_INPUT_FIELDS = {
	dob: {
		type: 'date',
		label: 'Date of Birth',
	},
	gender: {
		type: 'select',
		label: 'Gender',
		options: ['Not Specified', 'Male', 'Female'],
	},
};

const MAX_CODE_LENGTH = 4;
const MINIMUM_DATE = '1900-01-01';

const SignUp = ({ navigation, route }: ApplicationScreenProps) => {
	const [state, setState] = useState<State>({
		allowEmail: false,
		validatingEmail: null,
		role: null,
		roleModal: false,
		roleModalTopHeight: '20%',
		verified: false,
		useQR: false,
		code: (route.params as SignUpParams)?.gymCode || '',
		gymInfo: null,
		processing: false,
		proceed: false,
		fetching: false,
		fields: null,
		fieldsError: {},
		requiredFields: [],
		activeFieldInput: null,
	});

	const [dateValue, setDateValue] = useState<string>(
		moment().subtract(10, 'years').format(Constant.DEFAULT_DATE_FORMAT),
	);

	const [allowPassword, setAllowPassword] = useState<boolean>();

	const roleModalRef: RefObject<ModalComponent> = createRef();
	const stateRef = useRef<State>();
	stateRef.current = state;
	let timeoutFunction: NodeJS.Timeout | null = null;
	const recaptchaRef = useRef<GoogleRecaptchaRefAttributes>(null);
	const { signIn } = useAuth();

	useEffect(() => {
		const fields: Fields = {} as Fields;
		SIGNUP_INPUT_FIELDS.forEach(input => {
			fields[input.id as keyof Fields] = '';
		});

		setState(prevState => ({ ...prevState, fields }));

		return () => {
			if (timeoutFunction) {
				clearTimeout(timeoutFunction);
			}
		};
	}, []);

	useEffect(() => {
		void (async () => {
			if (state.code.length === MAX_CODE_LENGTH) {
				await fetchGymData();
			}
		})();
	}, [state.code]);

	const fetchGymData = async () => {
		setState(prevState => ({ ...prevState, fetching: true }));

		const teamId = state.code;

		const res = await getUserGymInfoV2(teamId);

		if (res.error) {
			Say.err(res.message);
		} else {
			const info: GymInfoType = res.gym_info as GymInfoType;

			setState(prevState => ({
				...prevState,
				gymInfo: info,
				role: (info.member_roles[0] as MemberRolesType).id,
				requiredFields: parseRequiredFields(
					info.required_profile_fields,
				),
			}));
		}

		Keyboard.dismiss();
		setState(prev => ({ ...prev, fetching: false }));
	};

	const parseRequiredFields = (theRequiredFields: string[]) => {
		if (isArray(theRequiredFields)) {
			return theRequiredFields.map(
				(field: string) =>
					({
						id: field,
						autoCapitalize: 'none',
						label:
							field in SIGNUP_CUSTOM_INPUT_FIELDS
								? SIGNUP_CUSTOM_INPUT_FIELDS[
										field as keyof CustomFields
									]?.label
								: capitalize(field.replace(/_/g, ' ')),
						type:
							SIGNUP_CUSTOM_INPUT_FIELDS[
								field as keyof CustomFields
							]?.type || 'text',
						data:
							SIGNUP_CUSTOM_INPUT_FIELDS[
								field as keyof CustomFields
							] || null,
					}) as RequiredFields,
			);
		}

		return [];
	};

	const toggleRoleModal = () => {
		setState(prevState => ({ ...prevState, roleModal: !state.roleModal }));
		(roleModalRef.current as ModalComponent).measureWindow(setModalTop);
	};

	const setModalTop = (_left: string, top: DimensionValue) => {
		setState(prevState => ({ ...prevState, roleModalTopHeight: top }));
	};

	const handleOnChange = (code: string) => {
		setState(prev => ({ ...prev, code, gymInfo: null }));
	};

	const onCaptchaVerified = async () => {
		setState(prevState => ({
			...prevState,
			fieldsError: {},
			verified: true,
		}));
		const { fields, role, code } = stateRef.current as State;

		const hasEmptyFields = validateFields();
		if (hasEmptyFields) {
			Say.warn('Please fill up all required fields');
			return false;
		}

		if (!allowPassword) {
			Say.warn(
				'Invalid password. Ensure it meets the required guidelines.',
			);
			return false;
		}

		setState(prevState => ({ ...prevState, processing: true }));
		SimpleToast.show('Please wait...', SimpleToast.SHORT);

		const payload = {
			...fields,
			team_id: Number(code),
			role,
		};

		const res = await register(payload);
		if (res.error) {
			if (res.data) {
				setState(prevState => ({
					...prevState,
					fieldsError: res.data as FormErrors,
				}));
			}
		} else {
			void Say.okThen('Successfully Registered!').then(async () => {
				SimpleToast.show('Signing in...', SimpleToast.SHORT);

				await signIn(
					payload.email as string,
					payload.password as string,
				).then(user => {
					if (user) navigation.navigate('Startup');
				});
			});
		}

		setState(prevState => ({ ...prevState, processing: false }));
		return recaptchaRef.current?.close();
	};

	const onCaptchaError = () => {
		recaptchaRef.current?.close();
	};

	const onSubmit = async () => {
		setState(prevState => ({ ...prevState, fieldsError: {} }));
		const { fields, role, verified, code } = stateRef.current as State;
		if (!verified) {
			recaptchaRef.current?.open();
			return false;
		}

		const hasEmptyFields = validateFields();
		if (hasEmptyFields) {
			Say.warn('Please fill up all required fields');
			return false;
		}

		if (!allowPassword) {
			Say.warn(
				'Invalid password. Ensure it meets the required guidelines.',
			);
			return false;
		}

		setState(prevState => ({ ...prevState, processing: true }));
		SimpleToast.show('Please wait...', SimpleToast.SHORT);

		const payload = {
			...fields,
			team_id: Number(code),
			role,
		};

		const res = await register(payload);
		if (res.error) {
			if (res.data) {
				setState(prevState => ({
					...prevState,
					fieldsError: res.data as FormErrors,
				}));
			}
		} else {
			void Say.okThen('Successfully Registered!').then(async () => {
				SimpleToast.show('Signing in...', SimpleToast.SHORT);

				await signIn(
					payload.email as string,
					payload.password as string,
				).then(user => {
					if (user) navigation.navigate('Startup');
				});
			});
		}

		return setState(prevState => ({ ...prevState, processing: false }));
	};

	const validateFields = () => {
		const { fields, requiredFields } = state;

		const fieldsError = {};

		[...SIGNUP_INPUT_FIELDS, ...requiredFields].forEach(field => {
			if (isEmpty((fields as Fields)[field.id as keyof Fields])) {
				(fieldsError as FormErrors)[field.id] = [
					`${field.label} is required`,
				];
			}
		});

		setState(prevState => ({ ...prevState, fieldsError }));
		return !isEmpty(fieldsError);
	};

	const handleErrorMessage = (err: string[] | string) => {
		if (isArray(err)) {
			throw new Error(err.join('\n'));
		} else {
			throw new Error(err);
		}
	};

	const handleCheckUserEmail = (email: string, timeout = 500) => {
		timeoutFunction = setTimeout(() => {
			void (async () => {
				try {
					setState(prevState => ({
						...prevState,
						validatingEmail: true,
					}));

					const reg =
						/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

					if (!reg.test(email)) {
						Say.warn('Invalid email address');
						return;
					}

					const res = await checkEmail(email);

					if (!res.error) {
						if (res.data.exists) {
							if (res.data.isActive) {
								await Say.okThen(
									'Email already exist. Please sign in instead',
									'Oops!',
								).then(() =>
									navigation.push('Login', {
										emailFromSignin: email,
									}),
								);
							} else {
								await Say.okThen(
									'Email already exist. Please contact your gym administrator to activate your account',
									'Oops!',
								).then(() =>
									navigation.push('Login', {
										emailFromSignin: email,
									}),
								);
							}
						} else if (res.data.pendingInvite) {
							await Say.okThen(
								'You have a pending invitation. Please check your email for the invitation code',
								'Oops!',
							).then(() => navigation.replace('Invite'));
						} else {
							setState(prevState => ({
								...prevState,
								allowEmail: true,
							}));
						}
					} else {
						handleErrorMessage(res.message);
					}
				} catch (error) {
					Say.warn(error as string);
				} finally {
					setState(prevState => ({
						...prevState,
						validatingEmail: false,
					}));
				}
			})();
		}, timeout);
	};

	const handleOnRolePress = (roleId: number) => {
		setState(prevState => ({ ...prevState, role: roleId }));
		toggleRoleModal();
	};

	const clearActiveField = () => {
		setState(prevState => ({ ...prevState, activeFieldInput: null }));
	};

	const handleTextOnChange = (id: string, text: string) => {
		const { fieldsError, fields } = state;

		delete fieldsError[id];

		(fields as Fields)[id as keyof Fields] = text;

		if (id === 'email') {
			setState(prevState => ({ ...prevState, allowEmail: false }));
		}

		setState(prevState => ({ ...prevState, fields, fieldsError }));
	};

	const handleRightIconClicked = () => {
		const { code } = state;
		if (code) {
			setState(prevState => ({ ...prevState, code: '', gymInfo: null }));
		} else {
			handleOpenCamera();
		}
	};

	const handleOpenCamera = () => {
		const PERMISSION =
			Platform.OS === 'android'
				? PERMISSIONS.ANDROID.CAMERA
				: PERMISSIONS.IOS.CAMERA;
		if (Platform.OS === 'android') {
			request(PERMISSION)
				.then(res => {
					if (res === RESULTS.GRANTED) {
						setState(prevState => ({ ...prevState, useQR: true }));
					} else {
						Alert.alert(
							'Permission Denied',
							'Please allow camera permission to scan QR code',
						);
					}
				})
				.catch(() => Say.err('Failed to request camera permission'));
		} else {
			setState(prevState => ({ ...prevState, useQR: true }));
		}
	};

	const renderFormView = () => {
		const { gymInfo, processing, role, activeFieldInput } = state;
		const rolesList = gymInfo?.member_roles;
		const currentRole = rolesList?.find(e => e.id === role);
		const submitButtonStyle: ViewStyle = {
			...styles.buttonStyle,
			width: '100%',
			backgroundColor:
				!state.allowEmail || state.processing
					? config.backgrounds.lightgrey
					: config.colors.brand,
		};

		return (
			<>
				<ScrollView
					contentContainerStyle={{ padding: config.metrics.lg }}
					keyboardShouldPersistTaps="handled"
				>
					<Modal
						animationType="fade"
						transparent
						visible={state.roleModal}
					>
						<View style={styles.roleModalConStyle}>
							<TouchableWithoutFeedback onPress={toggleRoleModal}>
								<View style={styles.modalMemberRole} />
							</TouchableWithoutFeedback>

							<Card
								style={[
									styles.modalStyle,
									{ top: state.roleModalTopHeight },
								]}
							>
								{rolesList?.map((roleItem, rIndex) => (
									<TouchableOpacity
										key={rIndex}
										style={styles.roleSelectStyle}
										onPress={() =>
											handleOnRolePress(roleItem.id)
										}
										disabled={processing}
									>
										<Text>{roleItem.name}</Text>
										{roleItem.id === currentRole?.id && (
											<Icon
												name="check"
												color={config.colors.brand}
												size={config.metrics.sm}
											/>
										)}
									</TouchableOpacity>
								))}
							</Card>
						</View>
					</Modal>

					{/* Date Modal */}
					<DateTimePicker
						mode="date"
						isVisible={activeFieldInput?.type === 'date'}
						onConfirm={date => {
							handleTextOnChange(
								activeFieldInput?.id as string,
								moment(date).format(
									Constant.DEFAULT_DATE_FORMAT,
								),
							);
							setDateValue(
								moment(date).format(
									Constant.DEFAULT_DATE_FORMAT,
								),
							);
							clearActiveField();
						}}
						onCancel={clearActiveField}
						maximumDate={new Date()}
						minimumDate={new Date(MINIMUM_DATE)}
						date={new Date(dateValue)}
					/>

					{/* Select Modal */}
					<BottomPanel
						visible={activeFieldInput?.type === 'select'}
						onClose={clearActiveField}
					>
						<View>
							{activeFieldInput?.data?.options?.map(
								(option: string, index: number) => (
									<TouchableOpacity
										key={index}
										onPress={() => {
											handleTextOnChange(
												activeFieldInput?.id,
												option,
											);
											clearActiveField();
										}}
										style={styles.bottomPanelTouch}
									>
										<Text size="rg">{option}</Text>
									</TouchableOpacity>
								),
							)}
						</View>
					</BottomPanel>

					<GoogleRecaptcha
						siteKey={Constant.RECAPTCHA.siteKey}
						baseUrl={Constant.RECAPTCHA.baseURL}
						ref={recaptchaRef}
						onVerify={() => void onCaptchaVerified()}
						onError={onCaptchaError}
						onExpire={onCaptchaError}
					/>

					<Text size="md" center>
						Let&apos;s grab some details
					</Text>
					<Spacer />

					{SIGNUP_INPUT_FIELDS.map((field, index) => (
						<InputField
							key={index}
							field={field as RequiredFields}
							processing={state.processing}
							allowEmail={state.allowEmail}
							fields={state.fields}
							handleTextOnChange={handleTextOnChange}
							validatingEmail={state.validatingEmail as boolean}
							handleCheckUserEmail={handleCheckUserEmail}
							fieldsError={state.fieldsError}
							setState={setState}
							allowPassword={allowPassword}
							setAllowPassword={setAllowPassword}
						/>
					))}

					{state.requiredFields.length > 0 && (
						<Text
							center
							size="md"
							color="darkgray"
							style={{ marginTop: config.metrics.xl }}
						>
							Your gym requires the following
						</Text>
					)}

					{state.requiredFields.map((field, index) => (
						<InputField
							key={index}
							field={field}
							processing={state.processing}
							allowEmail={state.allowEmail}
							fields={state.fields}
							handleTextOnChange={handleTextOnChange}
							validatingEmail={state.validatingEmail as boolean}
							handleCheckUserEmail={handleCheckUserEmail}
							fieldsError={state.fieldsError}
							setState={setState}
							allowPassword={allowPassword}
							setAllowPassword={setAllowPassword}
						/>
					))}

					<Spacer size="lg" />

					<Row align="center" spacing="center">
						<Icon
							name={
								state.verified
									? 'checkbox-outline'
									: 'checkbox-blank-outline'
							}
							color={
								state.allowEmail
									? config.colors.brand
									: config.backgrounds.lightgrey
							}
							size={25}
							onPress={() =>
								!state.verified && state.allowEmail
									? recaptchaRef.current?.open()
									: Say.err(
											'Please enter a valid email address',
										)
							}
						/>
						<Spacer horizontal size="sm" />
						<Text size="lg">I am not a robot</Text>
					</Row>

					<Button
						title="Submit"
						sm
						loading={state.processing}
						disabled={!state.allowEmail}
						labelStyle={{ color: config.backgrounds.light }}
						style={submitButtonStyle}
						onPress={() => void onSubmit()}
					/>
				</ScrollView>
				<KeyboardSpacer />
			</>
		);
	};

	const parseCode = (path: string) => {
		const urlArr = path.split('/');
		return urlArr[urlArr.length - 1]?.split('?')[0];
	};

	const handleOnScan = (code: string) => {
		setState(prevState => ({ ...prevState, useQR: false }));
		const qrCode: string = parseCode(code) as string;

		if (qrCode.length === MAX_CODE_LENGTH) {
			handleOnChange(qrCode);
		} else {
			SimpleToast.show('Invalid QR Code', SimpleToast.SHORT);
		}
	};

	const renderCodeEnterView = () => {
		const { code, gymInfo, fetching } = state;

		return (
			<ScrollView contentContainerStyle={styles.container}>
				<QRCamera
					visible={state.useQR}
					onDismiss={() =>
						setState(prevState => ({ ...prevState, useQR: false }))
					}
					onFinish={qr => handleOnScan(qr as string)}
				/>

				<View style={styles.codeEnterViewContainer}>
					<Text center>Enter gym id you wish to join</Text>
					<Spacer size="md" />
					<View
						style={[
							styles.inputTextStyle,
							styles.codeEnterTextInputContainer,
						]}
					>
						<TextInput
							value={code}
							textAlign="center"
							onChangeText={value => void handleOnChange(value)}
							style={styles.enterCodeTextInput}
							maxLength={MAX_CODE_LENGTH}
							allowFontScaling={false}
						/>
						<Icon
							name={code ? 'close' : 'qrcode-scan'}
							color={config.backgrounds.darkgray}
							size={config.metrics.lg}
							style={styles.enterCodeIcon}
							onPress={handleRightIconClicked}
						/>
					</View>
					{fetching && (
						<ActivityIndicator
							style={{ paddingTop: config.metrics.xl }}
							color={config.colors.brand}
						/>
					)}
				</View>
				{gymInfo && (
					<View style={styles.gymInfoContainer}>
						<Text center style={styles.headerTextStyle}>
							Looks like you want to join
						</Text>
						<Spacer size="md" />
						<Row align="center">
							<Avatar source={gymInfo.logo} />
							<Spacer horizontal size="sm" />
							<Text center color="darkgray">
								{gymInfo.name}
							</Text>
						</Row>

						<Button
							title="Confirm"
							sm
							onPress={() =>
								setState(prevState => ({
									...prevState,
									proceed: true,
								}))
							}
							style={styles.buttonStyle}
						/>
					</View>
				)}
			</ScrollView>
		);
	};

	return state.proceed ? renderFormView() : renderCodeEnterView();
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: config.metrics.lg,
		paddingHorizontal: config.metrics.xl,
		justifyContent: 'space-evenly',
	},
	inputTextStyle: {
		minWidth: '50%',
		color: config.backgrounds.darkgray,
		borderColor: config.backgrounds.darkgray,
		borderWidth: 1,
		borderRadius: 4,
	},
	gymInfoContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: config.metrics.xl * 2,
	},
	headerTextStyle: {
		width: '65%',
	},
	buttonStyle: {
		marginTop: config.metrics.xl,
		width: '60%',
	},
	roleModalConStyle: {
		flex: 1,
		padding: 18,
		backgroundColor: 'rgba(0,0,0,.3)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalStyle: {
		width: '100%',
		padding: 0,
		position: 'absolute',
		top: '20%',
		maxHeight: DEVICEHEIGHT / 2,
	},
	roleSelectStyle: {
		paddingVertical: config.metrics.lg,
		paddingHorizontal: config.metrics.md,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	modalMemberRole: { flex: 1, width: '100%' },
	bottomPanelTouch: {
		borderBottomWidth: 1,
		borderBottomColor: '#EEEEEE',
		padding: config.metrics.lg,
	},
	enterCodeIcon: {
		position: 'absolute',
		right: 0,
		padding: 10,
	},
	enterCodeTextInput: { width: '70%', paddingVertical: 10 },
	codeEnterViewContainer: { alignItems: 'center' },
	codeEnterTextInputContainer: { flexDirection: 'row', alignItems: 'center' },
});

export default SignUp;
