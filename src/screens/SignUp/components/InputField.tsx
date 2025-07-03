import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { GymInfoType } from '@/types/schemas/gym';
import { debounce, isEmpty, isNull } from 'lodash';
import { Dispatch, SetStateAction } from 'react';
import {
	ActivityIndicator,
	DimensionValue,
	Keyboard,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const inputCustomTheme = {
	colors: {
		primary: config.backgrounds.mute,
	},
	fonts: {
		regular: layout.fontMontserratRegular,
	},
};

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

type FormErrors = {
	[key: string]: string[];
};

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

type AutoCapitalizeType =
	| 'none'
	| 'sentences'
	| 'words'
	| 'characters'
	| undefined;

const InputField = ({
	field,
	processing,
	fields,
	fieldsError,
	allowEmail,
	validatingEmail,
	handleTextOnChange,
	handleCheckUserEmail,
	setState,
	allowPassword,
	setAllowPassword,
}: {
	field: RequiredFields;
	processing: boolean;
	allowEmail: boolean;
	fields: {
		email: string;
		firstname: string;
		lastname: string;
		password: string;
		password_confirmation: string;
	} | null;
	handleTextOnChange: (id: string, text: string) => void;
	validatingEmail: boolean;
	handleCheckUserEmail: (email: string, timeout?: number) => void;
	fieldsError: FormErrors;
	setState: Dispatch<SetStateAction<State>>;
	allowPassword: boolean | undefined;
	setAllowPassword: Dispatch<SetStateAction<boolean | undefined>>;
}) => {
	const isEmailField = field.id === 'email';
	const isPasswordField = field.id === 'password';

	const validatePassword = debounce((password: string) => {
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
			setAllowPassword(true);
		} else {
			setAllowPassword(false);
		}
	}, 1000);

	const disabled = processing;

	const renderIcon = () => {
		if (validatingEmail) {
			return (
				<ActivityIndicator
					size="small"
					color={config.backgrounds.mute}
				/>
			);
		}
		if (!isEmpty((fields as Fields)[field.id as keyof Fields])) {
			if (allowEmail) {
				return (
					<Icon
						name="check"
						size={config.metrics.lg}
						color={config.colors.success}
					/>
				);
			}
			return (
				<Icon
					name="close"
					size={config.metrics.lg}
					color={config.colors.danger}
				/>
			);
		}
		return null;
	};

	const renderIconForPassword = () => {
		if (!isEmpty((fields as Fields)[field.id as keyof Fields])) {
			if (allowPassword) {
				return (
					<Icon
						name="check"
						size={config.metrics.lg}
						color={config.colors.success}
					/>
				);
			}
			return (
				<Icon
					name="close"
					size={config.metrics.lg}
					color={config.colors.danger}
				/>
			);
		}
		return null;
	};

	let inputComponent = (
		<>
			<View style={styles.inputContainer}>
				<TextInput
					key={field.id}
					autoFocus={isEmailField}
					label={
						<Text style={{ ...layout.fontMontserratRegular }}>
							{field.label}
						</Text>
					}
					value={(fields as Fields)[field.id as keyof Fields]}
					onChangeText={text => {
						handleTextOnChange(field.id, text);

						if (isPasswordField && !isEmpty(fields?.password)) {
							validatePassword(fields?.password as string);
						}
					}}
					onSubmitEditing={() => {
						if (isEmailField) {
							handleCheckUserEmail(fields?.email as string, 0);
						}
						if (isPasswordField) {
							validatePassword(fields?.password as string);
						}
					}}
					onBlur={() => {
						if (isEmailField && !isEmpty(fields?.email)) {
							handleCheckUserEmail(fields?.email as string);
						}
					}}
					autoComplete="off"
					style={styles.input}
					autoCapitalize={field.autoCapitalize}
					underlineColor="white"
					secureTextEntry={field.secure}
					theme={inputCustomTheme}
					error={!isEmpty(fieldsError[field.id])}
					disabled={disabled}
					contentStyle={{ ...layout.fontMontserratRegular }}
					allowFontScaling={false}
				/>
				{isEmailField && !isNull(validatingEmail) && (
					<View style={styles.inputRightContainer}>
						{renderIcon()}
					</View>
				)}
				{isPasswordField &&
					(!isEmpty(allowPassword) ||
						allowPassword !== undefined) && (
						<View style={styles.inputRightContainer}>
							{renderIconForPassword()}
						</View>
					)}
			</View>
			{isPasswordField &&
				!allowPassword &&
				!isEmpty((fields as Fields)[field.id as keyof Fields]) && (
					<View>
						<Text
							style={{
								...layout.fontInterRegular,
								color: config.colors.danger,
								fontSize: config.fonts.metrics.xs,
							}}
						>
							Password must be between 8-256 characters and
							include at least three of the following: lowercase,
							uppercase, numbers, and symbols.
						</Text>
					</View>
				)}
		</>
	);
	if (field.type === 'date' || field.type === 'select') {
		inputComponent = (
			<TouchableOpacity
				style={styles.inputContainer}
				disabled={disabled}
				onPress={() => {
					Keyboard.dismiss();
					setState(prevState => ({
						...prevState,
						activeFieldInput: field,
					}));
				}}
			>
				<TextInput
					key={field.id}
					label={
						<Text style={{ ...layout.fontMontserratRegular }}>
							{field.label}
						</Text>
					}
					value={(fields as Fields)[field.id as keyof Fields]}
					style={styles.input}
					autoCapitalize={field.autoCapitalize}
					underlineColor="white"
					theme={{
						...inputCustomTheme,
						colors: { disabled: config.backgrounds.mute },
					}}
					error={!isEmpty(fieldsError[field.id])}
					disabled
					contentStyle={{ ...layout.fontMontserratRegular }}
					allowFontScaling={false}
				/>

				<View style={styles.inputRightContainer}>
					<Icon
						name={
							field.type === 'date' ? 'calendar' : 'chevron-down'
						}
						size={config.metrics.xl}
						color={
							disabled
								? config.backgrounds.lightgrey
								: config.backgrounds.dark
						}
					/>
				</View>
			</TouchableOpacity>
		);
	}

	return (
		<View key={field.id}>
			{inputComponent}
			{fieldsError[field.id]?.map((err, eIndex) => (
				<HelperText key={eIndex} type="error" visible>
					{err}
				</HelperText>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	input: {
		width: '100%',
		borderWidth: 1,
		borderRadius: 4,
		borderColor: '#f2f2f2',
		backgroundColor: 'transparent',
		fontSize: config.fonts.metrics.rg,
		...layout.fontMontserratRegular,
	},
	inputContainer: {
		justifyContent: 'center',
		marginTop: config.metrics.md,
	},
	inputRightContainer: {
		color: config.backgrounds.darkgray,
		position: 'absolute',
		right: '2%',
		padding: 10,
	},
});

export default InputField;
