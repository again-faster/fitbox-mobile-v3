import { KeyboardSpacer, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { Constant } from '@/utils';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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
}: ScoreCommentProps) => (
	<BottomPanel
		title="Comments / Notes"
		visible={commentField !== null}
		onClose={onClose}
		rightTitle={
			<TouchableOpacity onPress={() => onSave()}>
				<Text size="md" style={styles.doneText}>
					Done
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
									color={memberTheme.colors.primary}
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
					placeholderTextColor={memberTheme.colors.textMuted}
					selectionColor={memberTheme.colors.primary}
					multiline
					allowFontScaling={false}
					textAlignVertical="top"
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
		color: memberTheme.colors.text,
		fontSize: config.fonts.metrics.md,
		...layout.fontMontserratRegular,
		height: '100%',
	},
	commentInputStyle: {
		borderColor: memberTheme.colors.border,
		borderWidth: 1,
		textAlignVertical: 'top',
		width: '100%',
		height: 150,
		borderRadius: memberTheme.radius.md,
		backgroundColor: memberTheme.colors.surface,
		padding: 15,
		marginBottom: config.metrics.md,
	},
	commentModalContainer: {
		paddingVertical: config.metrics.lg,
		paddingHorizontal: config.metrics.md,
	},
	checkBox: {
		borderRadius: memberTheme.radius.sm,
		borderWidth: 1,
		borderColor: memberTheme.colors.primary,
		width: 20,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	doneText: {
		color: memberTheme.colors.primary,
	},
});
