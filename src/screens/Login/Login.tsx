// import { ScrollView } from '@/components/atoms';
// import { SafeScreen } from '@/components/template';
import { config } from '@/theme/_config';
import { Dimensions, StyleSheet, Text } from 'react-native';

const { width } = Dimensions.get('window');

// interface LoginProps { }

const Login = () => {
	return <Text style={style.header}>Enter your details</Text>;

	// return (
	// 	<SafeScreen>
	// 		<View style={{ flex: 1 }}>
	// 			<ScrollView keyboardShouldPersistTaps="handled">
	// 				<View style={style.formSection}>
	// 					<Spacer rg />

	// 					<View style={style.inputContainer}>
	// 						<TextInput
	// 							ref="email"
	// 							label="Email"
	// 							mode="flat"
	// 							value={email}
	// 							onChangeText={this.handleChangeEmail}
	// 							onSubmitEditing={_handleCheckEmail}
	// 							autoCompleteType="off"
	// 							style={style.input}
	// 							labelStyle={AppStyles.fontAlata}
	// 							underlineColor="transparent"
	// 							autoCapitalize="none"
	// 							returnKeyType="next"
	// 							keyboardType="email-address"
	// 							theme={inputCustomTheme}
	// 						/>

	// 						<View style={style.showPasswordBtn}>
	// 							{fetching ? (
	// 								// show loading indicator
	// 								<ActivityIndicator
	// 									size="small"
	// 									color={Colors.black}
	// 								/>
	// 							) : // show arrow icon
	// 							!isEmpty(email) && !userExist ? (
	// 								<Icon
	// 									name={'arrow-right'}
	// 									onPress={_handleCheckEmail}
	// 									size={Metrics.font.xl}
	// 								/>
	// 							) : null}
	// 						</View>
	// 					</View>

	// 					{!userExist && (
	// 						<TouchableOpacity
	// 							onPress={this.handleForgotPassword}
	// 							style={style.forgotPasswordContainer}
	// 						>
	// 							<Text darkgray style={style.mdText}>
	// 								Forgot Password?
	// 							</Text>
	// 						</TouchableOpacity>
	// 					)}

	// 					{userExist ? (
	// 						<>
	// 							<Spacer rg />

	// 							<View style={style.inputContainer}>
	// 								<TextInput
	// 									ref="password"
	// 									label="Password"
	// 									value={password}
	// 									onChangeText={this.handleChangePassword}
	// 									autoFocus={true}
	// 									onSubmitEditing={_handleSignIn}
	// 									autoCompleteType="off"
	// 									secureTextEntry={passwordHide}
	// 									style={style.input}
	// 									autoCapitalize="none"
	// 									underlineColor="white"
	// 									theme={inputCustomTheme}
	// 								/>
	// 								{password ? (
	// 									<Icon
	// 										name={
	// 											passwordHide
	// 												? 'eye-outline'
	// 												: 'eye-off-outline'
	// 										}
	// 										style={style.showPasswordBtn}
	// 										onPress={() =>
	// 											this.setState({
	// 												passwordHide:
	// 													!this.state
	// 														.passwordHide,
	// 											})
	// 										}
	// 										size={Metrics.font.xl}
	// 									/>
	// 								) : null}
	// 							</View>

	// 							<Spacer sm />

	// 							<TouchableOpacity
	// 								onPress={this.handleForgotPassword}
	// 								style={style.forgotPasswordContainer}
	// 							>
	// 								<Text darkgray style={style.mdText}>
	// 									Forgot Password?
	// 								</Text>
	// 							</TouchableOpacity>
	// 						</>
	// 					) : null}
	// 				</View>
	// 			</ScrollView>

	// 			{!isKeyboardVisible && (
	// 				<View style={style.footerSection}>
	// 					<Button
	// 						t="Login"
	// 						onPress={
	// 							userExist ? _handleSignIn : _handleCheckEmail
	// 						}
	// 						loading={processing}
	// 						disabled={isEmpty(email)}
	// 						labelStyle={style.buttonLabelStyle}
	// 						style={{
	// 							...style.buttonStyle,
	// 							backgroundColor: isEmpty(email)
	// 								? Colors.lightgrey
	// 								: Colors.brand,
	// 						}}
	// 					/>

	// 					<Spacer sm />

	// 					<Row
	// 						style={{
	// 							alignSelf: 'center',
	// 							paddingVertical: Metrics.md,
	// 						}}
	// 					>
	// 						<Text
	// 							brand
	// 							style={style.mdText}
	// 							onPress={() =>
	// 								this.props.navigation.navigate('SignUp')
	// 							}
	// 						>
	// 							Create an Account
	// 						</Text>
	// 					</Row>
	// 				</View>
	// 			)}
	// 		</View>
	// 	</SafeScreen>
	// );
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
		// ...AppStyles.fontAlata,
	},
	mdText: {
		fontSize: config.fonts.metrics.md,
		// ...AppStyles.fontAlata,
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
	},
	buttonStyle: {
		borderRadius: 6,
		elevation: 0,
	},
	buttonLabelStyle: {
		fontSize: config.fonts.sizes[1],
		textTransform: 'capitalize',
		paddingVertical: config.metrics.rg,
		// ...AppStyles.fontAlata,
	},
	showPasswordBtn: {
		color: config.colors.brand,
		position: 'absolute',
		right: '2%',
		padding: 10,
		// ...AppStyles.fontAlata,
	},
});
