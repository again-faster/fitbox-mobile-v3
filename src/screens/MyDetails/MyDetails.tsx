import useAuth from '@/auth/hooks/useAuth';
import {
	Avatar,
	Button,
	Card,
	HR,
	Row,
	ScrollView,
	Spacer,
	Text,
} from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import {
	changeProfileImage,
	getUserProfile,
	updateUserProfile,
} from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { MenuStackNavigatorProps } from '@/types/navigation';
import { GenderType } from '@/types/schemas/common';
import { UserProfileType, UserSchemaType } from '@/types/schemas/user';
import { Constant, Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Keyboard,
	SafeAreaView,
	StyleProp,
	StyleSheet,
	TextInput,
	TextStyle,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
	ViewStyle,
} from 'react-native';
import ImageCropPicker, {
	Image,
	Options,
} from 'react-native-image-crop-picker';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width: DEVICE_WIDTH } = Dimensions.get('screen');

type GenderTypes = {
	value: string;
	icon: string;
	displayText: string;
};

type DataTypes = {
	pictureOptions: boolean;
	genderOptions: boolean;
	genderObj?: GenderTypes;
	datepicker: boolean;
	imageToken: number;
	date: string | Date;
	user: UserProfileType;
};

const MyDetails = ({ navigation }: MenuStackNavigatorProps) => {
	const { emptyRequiredFields, setAppState } = useStore(state => ({
		emptyRequiredFields: state.emptyRequiredFields,
		setAppState: state.setAppState,
	}));
	const { user, updateUser } = useAuth();

	const MINIMUM_DATE = '1900-01-01';

	const scrollViewStyle: StyleProp<ViewStyle> = {
		padding: 20,
		marginBottom: isEmpty(emptyRequiredFields) ? 0 : 50,
	};
	const GENDER_OPTION_LIST = [
		{ value: 'Male', displayText: 'Male', icon: 'mars' },
		{ value: 'Female', displayText: 'Female', icon: 'venus' },
		{
			value: 'Not Specified',
			displayText: 'Not Specified',
			icon: 'genderless',
		},
	];

	const imageOptions: Options = {
		cropperToolbarTitle: 'Crop Image',
		includeBase64: true,
		compressImageMaxHeight: 200,
		compressImageMaxWidth: 200,
		mediaType: 'photo',
		cropping: true,
		cropperCircleOverlay: true,
		cropperToolbarWidgetColor: 'white', // fails on hex color
		cropperToolbarColor: config.colors.brand,
		cropperActiveWidgetColor: config.colors.brand,
	};

	// states
	const [pictureOptions, setPictureOptions] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [datePicker, setDatePicker] = useState(false);
	const [dob, setDob] = useState<string>();
	const [isLoading, setIsLoading] = useState(true);
	const [userDobValid, setUserDobValid] = useState(false);

	const [data, setData] = useState<DataTypes>({
		pictureOptions: false,
		genderOptions: false,
		genderObj: {
			icon: 'genderless',
			displayText: 'Click to set',
			value: '',
		},
		imageToken: new Date().getTime(),
		datepicker: false,
		date: '',
		user: {
			address1: '',
			address2: '',
			city: '',
			contact_phone: '',
			current_weight: 0,
			dob: {
				date: '',
				timezone: '',
				timezone_type: 0,
			},
			email: '',
			emergency_contact_name: '',
			emergency_contact_number: '',
			eula_accepted: 0,
			face_id: '',
			first_name: '',
			gender: null,
			has_payment_details: 0,
			height: 0,
			last_name: '',
			postcode: '',
			profile_image: '',
			state: '',
			timezone: '',
			user_id: 0,
			waiver_accepted: 0,
		},
	});

	useEffect(() => {
		void (async () => {
			setIsLoading(true);
			try {
				const res = await getUserProfile(user?.id);

				setUserDobValid(
					moment(res.user_data.dob.date).isValid() &&
						moment(res.user_data.dob.date).isAfter(MINIMUM_DATE),
				);

				if (!res.error) {
					const newDate = new Date(res.user_data.dob.date);
					setDOBFn(newDate);
					const genderObj = GENDER_OPTION_LIST.find(
						item => item.value === res.user_data.gender,
					);

					setData({
						...data,
						user: res.user_data,
						genderObj,
						imageToken: new Date().getTime(),
					});
				}
				setIsLoading(false);
			} catch (e) {
				setIsLoading(false);
			}
		})();
	}, []);

	const saveButton = () => {
		return <Button title="SAVE" onPress={updateData} />;
	};

	const validateForm = () => {
		const {
			email,
			first_name: firstName,
			last_name: lastName,
			dob: date,
		} = data.user;
		// const { global: { empty_required_fields = [] } = {} } = this.props;
		// email
		if (!email || !email.includes('.') || !email.includes('@')) {
			return 'Invalid Email Address';
		}
		if (!firstName || firstName.length < 2) {
			return 'Invalid First Name';
		}
		if (!lastName || lastName.length < 2) {
			return 'Invalid Last Name';
		}
		if (!dob || !moment(date.date).isValid()) {
			return 'Invalid Date of Birth';
		}
		let error = null;
		emptyRequiredFields.forEach((field: string) => {
			if (field === 'dob' && !moment(dob).isValid()) {
				error = 'Invalid Date of Birth';
			} else if (isEmpty(data.user[field as keyof UserProfileType])) {
				error = `Invalid ${field.replace(/_/g, ' ').toUpperCase()}`;
			}
		});

		return error || false;
	};

	const updateData = () => {
		void (async () => {
			Keyboard.dismiss();
			setIsLoading(true);
			const formError = validateForm();
			if (formError) {
				Alert.alert('Error', formError);
				setIsLoading(false);
			} else {
				const { user: details } = data;
				const formattedDOB = moment(details.dob.date).format(
					Constant.DEFAULT_DATE_FORMAT,
				);
				const payload = {
					id: details.user_id,
					firstname: details.first_name,
					lastname: details.last_name,
					dob: formattedDOB,
					gender: details.gender,
					email: details.email,
					contact_phone: details.contact_phone,
					height: Number(details.height),
					current_weight: Number(details.current_weight),
					weight_unit: 'kg',
					emergency_contact_name: details.emergency_contact_name,
					emergency_contact_number: details.emergency_contact_number,
				};

				try {
					const response = await updateUserProfile(payload);

					// update state
					updateUser({
						...payload,
						first_name: details.first_name,
						last_name: details.last_name,
					} as unknown as UserSchemaType);

					// clear the empty required fields
					setAppState('emptyRequiredFields', []);

					if (response.error) {
						throw new Error(response.message);
					} else {
						Say.ok(response.message);
					}
				} catch (e) {
					// eslint-disable-next-line no-console
					console.log('error', e);
				} finally {
					setIsLoading(false);
				}
			}
		})();
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			title: 'Profile',
			headerRight: saveButton,
		});
	}, [data]);

	const datePickerVal = userDobValid ? new Date(dob as string) : new Date();

	// temporary variables
	const avatarImage = 'https://avatars.githubusercontent.com/u/15073128?v=4';

	// functions
	const setGenderFn = ({ displayText, value, icon }: GenderTypes) => {
		setData({
			...data,
			genderObj: { displayText, value, icon },
			genderOptions: !data.genderOptions,
			user: { ...data.user, gender: displayText as GenderType },
		});
	};

	const setDOBFn = (date: string | Date) => {
		const newDate: Date = new Date(date);
		const formattedDate = moment(newDate).format(
			Constant.DEFAULT_DATE_FORMAT,
		);
		setDob(formattedDate);
		setData({
			...data,
			user: {
				...data.user,
				dob: {
					date: newDate.toString(),
					timezone: data.user.dob.timezone,
					timezone_type: data.user.dob.timezone_type,
				},
			},
		});
	};

	const confirmDOB = (date: string | Date) => {
		setUserDobValid(
			moment(date).isValid() && moment(date).isAfter(MINIMUM_DATE),
		);
		setDOBFn(date);
		setDatePicker(!datePicker);
	};

	const onInputChange = (key: string, value: string) => {
		setData({ ...data, user: { ...data.user, [key]: value } });
	};

	const applyInputValidationStyle = (
		fieldName: string,
		currentStyle: StyleProp<TextStyle>,
	) => {
		const { email, first_name: firstName, last_name: lastName } = data.user;

		const style: StyleProp<TextStyle> = {
			...(currentStyle as TextStyle),
			...layout.fontMontserratRegular,
		};

		// Check if the default required fields are empty
		switch (fieldName) {
			case 'email':
				if (!email || !email.includes('.') || !email.includes('@')) {
					style.borderColor = config.colors.danger;
				}
				break;
			case 'first_name':
				if (!firstName || firstName.length < 2) {
					style.borderColor = config.colors.danger;
				}
				break;
			case 'last_name':
				if (!lastName || lastName.length < 2) {
					style.borderColor = config.colors.danger;
				}
				break;
			default:
				style.borderColor = emptyRequiredFields.includes(fieldName)
					? config.colors.danger
					: style.borderColor;
				break;
		}

		return style;
	};

	const pickImageFromGallery = () => {
		void ImageCropPicker.openPicker(imageOptions).then(
			({ data: image }: Image) => uploadProfileImage(image as string),
		);
	};

	const pickImageFromCamera = () => {
		void ImageCropPicker.openCamera(imageOptions).then(
			({ data: image }: Image) => uploadProfileImage(image as string),
		);
	};

	const uploadProfileImage = async (imgData: string) => {
		try {
			setIsUploading(true);
			setPictureOptions(false);
			// Image data in base64
			const image = `data:image/jpg;base64,${imgData}`;

			// Upload image
			const res = await changeProfileImage({ image });

			if (!res.error) {
				Say.ok('Profile Image Changed!');
				setData({ ...data, imageToken: new Date().getTime() });

				updateUser({
					profile_image: data.user.profile_image,
				} as UserSchemaType);
			} else {
				let error = 'Something went wrong while uploading image';
				if (res?.message) {
					error = res.message;
				}

				throw new Error(error);
			}
		} catch (err) {
			Say.err(err as ICatchError);
		} finally {
			setIsUploading(false);
		}
	};

	const renderGenderItem = ({ displayText, value, icon }: GenderTypes) => {
		return (
			<Card
				key={value}
				style={styles.card}
				onPress={() => setGenderFn({ displayText, value, icon })}
			>
				<Row
					spacing="space-between"
					align="center"
					style={{ padding: config.metrics.sm }}
				>
					<Text size="lg" style={styles.genderCardText}>
						{displayText}
					</Text>
					<Icon
						name={icon}
						color={config.backgrounds.dark}
						size={config.metrics.lg}
					/>
				</Row>
			</Card>
		);
	};

	return isLoading ? (
		<View style={styles.loaderContainer}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<View>
			{!isEmpty(emptyRequiredFields) && (
				<View style={styles.bannerStyle}>
					<Text size="xs" color="danger" center>
						Please fill out the required fields
					</Text>
				</View>
			)}
			<ScrollView style={scrollViewStyle}>
				<SafeScreen>
					<DateTimePicker
						mode="date"
						date={datePickerVal}
						isVisible={datePicker}
						onConfirm={confirmDOB}
						onCancel={() => setDatePicker(!datePicker)}
						minimumDate={new Date(MINIMUM_DATE)}
						maximumDate={new Date()}
					/>

					<Row style={styles.row}>
						<View style={styles.profile}>
							<TouchableOpacity
								activeOpacity={0.7}
								onPress={() =>
									setPictureOptions(!pictureOptions)
								}
							>
								{isUploading ? (
									<ActivityIndicator
										size={config.metrics.md}
										color={config.colors.brand}
									/>
								) : (
									<Avatar
										source={
											`${data.user.profile_image}?v=${data.imageToken}` ||
											avatarImage
										}
										size={DEVICE_WIDTH / 3.5}
										style={styles.avatarStyle}
									/>
								)}
							</TouchableOpacity>
						</View>

						<View style={styles.nameContainer}>
							<Text style={styles.textLabelStyle}>
								First Name
							</Text>
							<TextInput
								style={applyInputValidationStyle(
									'first_name',
									styles.inputStyle,
								)}
								onChangeText={firstName =>
									onInputChange('first_name', firstName)
								}
								allowFontScaling={false}
							>
								{data.user.first_name}
							</TextInput>

							<Text style={styles.textLabelStyle}>Last Name</Text>
							<TextInput
								style={applyInputValidationStyle(
									'last_name',
									styles.inputStyle,
								)}
								onChangeText={lastName =>
									onInputChange('last_name', lastName)
								}
								allowFontScaling={false}
							>
								{data.user.last_name}
							</TextInput>
						</View>
					</Row>

					<Row style={styles.row}>
						<View style={styles.flexOne}>
							<Text style={styles.textLabelStyle}>D.O.B</Text>
							<TouchableOpacity
								style={applyInputValidationStyle('dob', {
									...styles.inputStyle,
									...styles.inputWithIconStyle,
								})}
								onPress={() => setDatePicker(!datePicker)}
							>
								<Text style={styles.textLabelStyle}>
									{userDobValid ? dob : 'Click to set'}
								</Text>
								<Icon
									name="calendar"
									size={config.metrics.lg}
								/>
							</TouchableOpacity>
						</View>
						<Spacer horizontal size="lg" />
						<View style={styles.flexOne}>
							<Text style={styles.textLabelStyle}>Gender</Text>
							<TouchableOpacity
								style={applyInputValidationStyle('gender', {
									...styles.inputStyle,
									...styles.inputWithIconStyle,
								})}
								onPress={() =>
									setData({
										...data,
										genderOptions: !data.genderOptions,
									})
								}
							>
								<Text style={styles.textLabelStyle}>
									{data?.genderObj
										? data.genderObj.displayText
										: 'Click to set'}
								</Text>
								<Icon
									name={
										data.genderObj
											? data.genderObj.icon
											: 'genderless'
									}
									size={config.metrics.lg}
								/>
							</TouchableOpacity>
						</View>
					</Row>

					<HR color={config.fonts.colors.gray100} />

					<Text style={styles.textHeader}>Contact Information</Text>

					<View style={{ marginBottom: config.metrics.md }}>
						<Text style={styles.textContact}>Email</Text>
						<TextInput
							style={applyInputValidationStyle(
								'email',
								styles.inputStyle,
							)}
							onChangeText={email =>
								onInputChange('email', email)
							}
							autoCapitalize="none"
							allowFontScaling={false}
						>
							{data.user.email}
						</TextInput>

						<Text style={styles.textContact}>Mobile number</Text>
						<TextInput
							style={applyInputValidationStyle(
								'contact_phone',
								styles.inputStyle,
							)}
							onChangeText={phone =>
								onInputChange('contact_phone', phone)
							}
							allowFontScaling={false}
						>
							{data.user.contact_phone}
						</TextInput>
					</View>

					<HR color={config.fonts.colors.gray100} />

					<Text style={styles.textHeader}>Measurement Stats</Text>

					<Row style={styles.measurementStatsRow}>
						<View style={styles.measurementStats}>
							<Text style={styles.textLabelStyle}>
								Height (cm)
							</Text>
							<TextInput
								style={applyInputValidationStyle(
									'height',
									styles.inputStyle,
								)}
								keyboardType="number-pad"
								onChangeText={height =>
									onInputChange('height', height)
								}
								allowFontScaling={false}
							>
								{data.user.height}
							</TextInput>
						</View>

						<Spacer horizontal size="lg" />

						<View style={styles.measurementStats}>
							<Text style={styles.textLabelStyle}>
								Weight (KG)
							</Text>
							<TextInput
								style={applyInputValidationStyle(
									'current_weight',
									styles.inputStyle,
								)}
								keyboardType="number-pad"
								onChangeText={weight =>
									onInputChange('current_weight', weight)
								}
								allowFontScaling={false}
							>
								{data.user.current_weight}
							</TextInput>
						</View>
					</Row>
					<HR color={config.fonts.colors.gray100} />

					<Text style={styles.textHeader}>Emergency Contact</Text>

					<View style={{ marginBottom: config.metrics.xl }}>
						<Text style={styles.textContact}>Name</Text>
						<TextInput
							style={applyInputValidationStyle(
								'emergency_contact_name',
								styles.inputStyle,
							)}
							onChangeText={emergencyName =>
								onInputChange(
									'emergency_contact_name',
									emergencyName,
								)
							}
							allowFontScaling={false}
						>
							{data.user.emergency_contact_name}
						</TextInput>

						<Text style={styles.textContact}>Mobile Number</Text>
						<TextInput
							style={applyInputValidationStyle(
								'emergency_contact_number',
								styles.inputStyle,
							)}
							onChangeText={emergencyNumber =>
								onInputChange(
									'emergency_contact_number',
									emergencyNumber,
								)
							}
							allowFontScaling={false}
						>
							{data.user.emergency_contact_number}
						</TextInput>
					</View>
				</SafeScreen>
			</ScrollView>
			{/* Modals */}
			<Modal visible={pictureOptions}>
				<SafeAreaView style={styles.modalContainer}>
					<TouchableWithoutFeedback
						onPress={() => setPictureOptions(!pictureOptions)}
						style={styles.flexOne}
					>
						<View style={styles.flexOne} />
					</TouchableWithoutFeedback>
					<Card onPress={pickImageFromGallery} style={styles.card}>
						<Row spacing="space-between" align="center">
							<Row align="center">
								<Icon
									name="images"
									color={config.backgrounds.dark}
									size={config.metrics.md}
								/>
								<Spacer horizontal />
								<Text size="lg">Gallery</Text>
							</Row>
							<Icon
								name="chevron-right"
								color={config.backgrounds.dark}
								size={config.metrics.md}
							/>
						</Row>
					</Card>
					<Card onPress={pickImageFromCamera} style={styles.card}>
						<Row spacing="space-between" align="center">
							<Row align="center">
								<Icon
									name="camera"
									color={config.backgrounds.dark}
									size={config.metrics.md}
								/>
								<Spacer horizontal />
								<Text size="lg">Camera</Text>
							</Row>
							<Icon
								name="chevron-right"
								color={config.backgrounds.dark}
								size={config.metrics.md}
							/>
						</Row>
					</Card>
				</SafeAreaView>
			</Modal>
			<Modal visible={data.genderOptions}>
				<SafeAreaView style={styles.modalContainer}>
					<TouchableWithoutFeedback
						onPress={() =>
							setData({
								...data,
								genderOptions: !data.genderOptions,
							})
						}
						style={styles.flexOne}
					>
						<View style={styles.flexOne} />
					</TouchableWithoutFeedback>
					{GENDER_OPTION_LIST.map(item => renderGenderItem(item))}
					<Spacer />
				</SafeAreaView>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	avatarStyle: {
		borderWidth: 2,
		borderColor: '#ABEDFF',
	},
	inputStyle: {
		borderColor: '#ABEDFF',
		borderWidth: 1,
		fontSize: 16,
		padding: config.metrics.rg,
		paddingLeft: 10,
		width: '100%',
		marginBottom: 10,
		borderRadius: 6,
		flexDirection: 'row',
	},
	textLabelStyle: {
		fontSize: 17,
		color: config.fonts.colors.darkgray,
		marginBottom: 2,
	},
	profile: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
	row: {
		marginBottom: config.metrics.md,
	},
	nameContainer: {
		flex: 1.5,
		marginLeft: config.metrics.xl,
	},
	inputWithIconStyle: {
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	textHeader: {
		fontSize: config.fonts.metrics.lg,
		fontWeight: 'bold',
		color: config.fonts.colors.darkgray,
		marginBottom: config.metrics.lg,
		marginTop: 6,
	},
	textContact: {
		fontSize: 17,
		marginBottom: 3,
		color: config.fonts.colors.darkgray,
	},
	modalContainer: {
		backgroundColor: 'rgba(0,0,0,0.3)',
		flex: 1,
		justifyContent: 'flex-end',
		paddingLeft: 20,
		paddingRight: 20,
		paddingBottom: 20,
	},
	flexOne: {
		flex: 1,
	},
	measurementStats: {
		flex: 1,
		justifyContent: 'space-between',
	},
	measurementStatsRow: {
		marginBottom: config.metrics.md,
		justifyContent: 'space-between',
	},
	card: {
		marginHorizontal: 20,
	},
	genderCardText: {
		fontFamily: 'Alata-Regular',
	},
	loaderContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	bannerStyle: {
		backgroundColor: 'white',
		paddingVertical: config.metrics.md,
		borderColor: config.backgrounds.gray,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1.41,
		elevation: 2,
		alignContent: 'center',
		borderWidth: 1,
	},
});
export default MyDetails;
