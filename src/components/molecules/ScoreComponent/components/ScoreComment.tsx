import { KeyboardSpacer, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { Constant } from '@/utils';
import {
	Keyboard,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import BottomPanel from '../../BottomPanel/BottomPanel';

interface ScoreCommentProps {
	commentValue: string | null;
	commentField: string | number | null;
	commentLeaderboardVisible?: boolean;
	enableLeaderboardComment?: boolean;
	onCommentChange: (val: string) => void;
	onLeaderboardClick?: () => void;
	onSave: () => void;
	onClose: () => void;
	isKeyboardVisible: boolean;
}

const ScoreComment = ({
	commentValue,
	commentField,
	commentLeaderboardVisible,
	enableLeaderboardComment,
	onCommentChange,
	onLeaderboardClick,
	onSave,
	onClose,
	isKeyboardVisible,
}: ScoreCommentProps) => (
	<BottomPanel
		title="Comments / Notes"
		visible={commentField !== null}
		onClose={onClose}
		rightTitle={
			<TouchableOpacity
				onPress={() =>
					isKeyboardVisible ? Keyboard.dismiss() : onSave()
				}
			>
				<Text color="info" size="md">
					{isKeyboardVisible ? 'Done' : 'Save'}
				</Text>
			</TouchableOpacity>
		}
	>
		<View style={styles.commentModalContainer}>
			{enableLeaderboardComment && onLeaderboardClick ? (
				<>
					<Row onPress={onLeaderboardClick}>
						<View style={styles.checkBox}>
							{commentLeaderboardVisible ? (
								<Icon
									name="check"
									style={styles.showLeaderboardIcon}
									color={config.fonts.colors.info}
								/>
							) : null}
						</View>

						<Spacer horizontal size="xs" />

						<Text size="md">Show on leaderboard</Text>
					</Row>

					<Spacer size="sm" />
				</>
			) : null}

			<View style={styles.commentInputStyle}>
				<TextInput
					autoFocus
					style={styles.commentInputLabelStyle}
					onChangeText={
						val => onCommentChange(val)
						// this.setState({ commentValue: val })
					}
					defaultValue={commentValue || ''}
					placeholder="Comments/Notes"
					multiline
					allowFontScaling={false}
				/>
			</View>

			<KeyboardSpacer heightDeduction={Constant.IS_ANDROID ? 0 : 50} />
		</View>
	</BottomPanel>
);

export default ScoreComment;

const styles = StyleSheet.create({
	showLeaderboardIcon: {
		fontSize: 10,
		fontWeight: 'bold',
	},
	commentInputLabelStyle: {
		color: config.fonts.colors.black,
		fontSize: config.fonts.metrics.md,
		...layout.fontMontserratRegular,
		height: '100%',
	},
	commentInputStyle: {
		borderColor: config.fonts.colors.lightgrey,
		borderWidth: 1,
		textAlignVertical: 'top',
		width: '100%',
		height: 150,
		borderRadius: 5,
		padding: 15,
		marginBottom: config.metrics.md,
	},
	commentModalContainer: {
		paddingVertical: config.metrics.lg,
		paddingHorizontal: config.metrics.md,
	},
	checkBox: {
		borderRadius: 6,
		borderWidth: 1,
		borderColor: config.fonts.colors.info,
		width: 20,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
