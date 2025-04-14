import { Row, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const RequiredFieldsModal = ({
	setShowRequiredFieldsModal,
}: {
	setShowRequiredFieldsModal: (value: boolean) => void;
}) => {
	return (
		<TouchableOpacity
			style={styles.containerStyle}
			onPress={() => navigate('MyDetails')}
		>
			<Row>
				<View style={styles.warningIconCon}>
					<MIcon
						name="account-alert"
						color={config.colors.danger}
						size={30}
					/>
				</View>

				<View style={styles.warningMessageCon}>
					<Text bold size="rg">
						Your gym requires extra information
					</Text>
					<Text
						size="xs"
						numberOfLines={2}
						style={{ marginTop: config.metrics.xs }}
					>
						Click to update the required fields in your profile
					</Text>
				</View>
				<View>
					<TouchableOpacity
						onPress={() => setShowRequiredFieldsModal(false)}
					>
						<MIcon
							name="close"
							size={15}
							color={config.backgrounds.darkgray}
						/>
					</TouchableOpacity>
				</View>
			</Row>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	containerStyle: {
		minHeight: 50,
		borderRadius: 4,
		position: 'absolute',
		bottom: 18,
		width: '91%',
		marginHorizontal: 18,
		alignSelf: 'center',
		...layout.shadowLight,
		paddingVertical: 4,
	},
	warningIconCon: {
		justifyContent: 'center',
		height: 50,
		paddingLeft: 10,
		paddingRight: 5,
	},
	warningMessageCon: {
		width: '80%',
		justifyContent: 'center',
	},
});

export default RequiredFieldsModal;
