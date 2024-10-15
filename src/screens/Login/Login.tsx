import useAuth from '@/auth/hooks/useAuth';
import { Button, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { Loader } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { navigate } from '@/navigators/NavigationRef';
import { checkEmail } from '@/services/auth';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationScreenProps, LoginParams } from '@/types/navigation';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';

import { isArray, isEmpty } from 'lodash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const { fonts, metrics } = config;

// custom theme for paper component
const inputCustomTheme = {
	colors: {
		primary: config.fonts.colors.mute,
	},
	fonts: {
		regular: {
			fontFamily: 'Alata-Regular',
		},
	},
};

const Login = ({ navigation, route }: ApplicationScreenProps) => {
	const { t } = useTranslation(['login']);
	const { signIn } = useAuth();

	const [email, setEmail] = useState<string>(
		(route.params as LoginParams)?.emailFromSignin || '',
	);
	const [password, setPassword] = useState<string>('');
	const [passwordHide, setPasswordHide] = useState<boolean>(true);
	const [fetching, setFetching] = useState<boolean>(false);
	const [userExist, setUserExist] = useState<boolean>(false);
	const [processing, setProcessing] = useState<boolean>(false);

	const handleChangePassword = (val: string) => setPassword(val);
	const handleForgotPassword = () => navigation.navigate('ResetPassword');
	const handleChangeEmail = (value: string) => {
		setEmail(value);
		setUserExist(false);
		setPassword('');
		setPasswordHide(true);
	};

	const handleErrorMessage = (err: string | string[]) => {
		if (isArray(err) && err.length > 0) {
			// Join array of errors
			return new Error(err.join('\n'));
		}

		return new Error(err as string);
	};

	const handleCheckUserEmail = () => {
		// check if email is empty then don't continue
		if (isEmpty(email)) return;

		// check also if its a valid email
		const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
		if (!reg.test(email)) {
			Say.warn('Invalid email address');
			return;
		}

		// show loading indicator
		setFetching(true);

		// check if email exist
		checkEmail(email)
			.then(res => {
				if (!res.error) {
					// check if user is active
					if (res.data.exists && res.data.isActive) {
						setUserExist(true);
					} else {
						setUserExist(false);

						if (res.data.pendingInvite) {
							void Say.okThen(
								'You have a pending invite. Please check your email for further instructions.',
								'Oops!',
							).then(() => {
								navigation.navigate('Invite');
							});

							// If pending invite, show alert sample
							// Alert.alert(
							//     'Oops!',
							//     'You have a pending invite. Please check your email for further instructions',
							//     [
							//         {
							//             text: 'Resend Invite BRO', onPress: () => {
							//                 Say.ok("Invitation has been sent")
							//             }
							//         },
							//         { text: 'Cancel', style: 'cancel' }
							//     ],
							//     { cancelable: true }
							// )
						} else {
							throw new Error(
								'User does not exist or is not active',
							);
						}
					}
				} else {
					throw handleErrorMessage(res.message);
				}
			})
			.catch(error => {
				Say.err(error as ICatchError);
			})
			.finally(() => {
				setFetching(false);
			});
	};

	const handleSignIn = () => {
		if (processing) return;

		const useEmail = email.trim();
		const usePassword = password.trim();

		if (!useEmail || !usePassword)
			Say.err('Please complete all information');
		else {
			setProcessing(true);

			// call auth service to sign in
			signIn(useEmail, usePassword)
				.then(res => {
					if (res) navigation.navigate('Startup');
				})
				.catch(() => {
					Say.err('There was an error signing in. Please try again.');
				})
				.finally(() => {
					setProcessing(false);
				});
		}
	};

	return (
		<SafeScreen>
			<View style={layout.flex_1}>
				<ScrollView keyboardShouldPersistTaps="handled">
					<View style={style.formSection}>
						<Text style={style.header} color="darkgray">
							{t('login:title')}
						</Text>

						<Spacer size="lg" />

						<View style={style.inputContainer}>
							<TextInput
								label={t('login:input.email')}
								mode="flat"
								value={email}
								onChangeText={handleChangeEmail}
								onSubmitEditing={() =>
									void handleCheckUserEmail()
								}
								autoComplete="off"
								style={[
									style.input,
									layout.fontMontserratRegular,
								]}
								underlineColor="transparent"
								autoCapitalize="none"
								returnKeyType="next"
								keyboardType="email-address"
								theme={inputCustomTheme}
							/>

							<View style={style.showPasswordBtn}>
								{fetching ? <Loader size="md" /> : null}

								{!isEmpty(email) && !userExist && !fetching ? (
									<Icon
										name="arrow-right"
										onPress={() => {
											void handleCheckUserEmail();
										}}
										size={fonts.metrics.xl}
									/>
								) : null}
							</View>
						</View>

						{!userExist && (
							<TouchableOpacity
								onPress={handleForgotPassword}
								style={style.forgotPasswordContainer}
							>
								<Text color="darkgray" style={style.mdText}>
									{t('login:button.forgotPassword')}
								</Text>
							</TouchableOpacity>
						)}

						{userExist ? (
							<>
								<Spacer size="rg" />

								<View style={style.inputContainer}>
									<TextInput
										label={t('login:input.password')}
										value={password}
										autoFocus
										onChangeText={handleChangePassword}
										onSubmitEditing={handleSignIn}
										autoComplete="off"
										secureTextEntry={passwordHide}
										style={[
											style.input,
											layout.fontMontserratRegular,
										]}
										autoCapitalize="none"
										underlineColor="white"
										theme={inputCustomTheme}
									/>

									{password ? (
										<Icon
											name={
												passwordHide
													? 'eye-outline'
													: 'eye-off-outline'
											}
											style={style.showPasswordBtn}
											onPress={() =>
												setPasswordHide(!passwordHide)
											}
											size={fonts.metrics.xl}
										/>
									) : null}
								</View>

								<Spacer size="sm" />

								<TouchableOpacity
									onPress={handleForgotPassword}
									style={style.forgotPasswordContainer}
								>
									<Text color="darkgray" style={style.mdText}>
										{t('login:button.forgotPassword')}
									</Text>
								</TouchableOpacity>
							</>
						) : null}
					</View>
				</ScrollView>

				<View style={style.footerSection}>
					<Button
						title={t('login:button.login')}
						onPress={
							userExist ? handleSignIn : handleCheckUserEmail
						}
						loading={processing}
						disabled={isEmpty(email)}
						labelStyle={style.buttonLabelStyle}
						style={{
							...style.buttonStyle,
							backgroundColor: isEmpty(email)
								? fonts.colors.lightgrey
								: fonts.colors.brand,
						}}
					/>

					<Spacer size="sm" />

					<Row align="center" style={style.registerButton}>
						<Text
							color="brand"
							style={style.mdText}
							onPress={() => navigate('SignUp')}
						>
							{t('login:button.register')}
						</Text>
					</Row>
				</View>
			</View>
		</SafeScreen>
	);
};

export default Login;

const style = StyleSheet.create({
	container: {
		flex: 1,
	},
	formSection: {
		marginTop: '12%',
		padding: config.metrics.lg,
		flex: 1,
	},
	footerSection: {
		padding: config.metrics.md,
	},
	header: {
		fontSize: width / 10,
	},
	mdText: {
		fontSize: config.fonts.metrics.md,
	},
	inputContainer: {
		justifyContent: 'center',
	},
	input: {
		borderWidth: 1,
		borderRadius: 4,
		borderColor: '#f2f2f2',
		backgroundColor: 'transparent',
	},
	forgotPasswordContainer: {
		alignItems: 'flex-end',
		marginTop: config.metrics.rg,
	},
	buttonStyle: {
		borderRadius: 6,
		elevation: 0,
	},
	buttonLabelStyle: {
		fontSize: config.fonts.sizes[1],
		textTransform: 'capitalize',
		paddingVertical: config.metrics.rg,
	},
	showPasswordBtn: {
		color: config.colors.brand,
		position: 'absolute',
		right: '2%',
		padding: 10,
	},
	registerButton: {
		paddingVertical: metrics.md,
		justifyContent: 'center',
	},
});
