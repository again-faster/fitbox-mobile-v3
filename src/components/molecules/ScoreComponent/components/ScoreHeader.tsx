import { Row, Text } from '@/components/atoms';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';

interface ScoreHeaderProps {
	title: string;
	hideRxSwitch: boolean;
	isRx: boolean;
	onRxChange: (val: boolean) => void;
}

const ScoreHeader = ({
	title,
	hideRxSwitch,
	isRx,
	onRxChange,
}: ScoreHeaderProps) => {
	const { width } = Dimensions.get('window');
	const characterLimit = width < 400 ? 20 : 30;
	const titleFontSize = title.length > characterLimit ? 'lg' : 'xl';
	const numberOfLines = title.length > characterLimit ? 4 : 0;

	return (
		<View style={styles.titleContainer}>
			<Text
				size={titleFontSize}
				bold
				style={[layout.flex_1, styles.title]}
				numberOfLines={numberOfLines}
			>
				{title}
			</Text>

			{!hideRxSwitch && (
				<Row style={[layout.itemsCenter]}>
					<Switch
						color={memberTheme.colors.primary}
						trackColor={{
							false: memberTheme.colors.border,
							true: memberTheme.colors.surfaceSoft,
						}}
						value={isRx}
						onValueChange={val => {
							onRxChange(val);
						}}
						style={styles.switch}
					/>
					<Text size="md" bold style={styles.rxLabel}>
						Rx
					</Text>
				</Row>
			)}
		</View>
	);
};

export default memo(ScoreHeader);

const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginHorizontal: memberTheme.spacing.lg,
		marginTop: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.md,
		backgroundColor: memberTheme.colors.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
		...memberTheme.shadow,
	},
	title: {
		color: memberTheme.colors.text,
	},
	rxLabel: {
		color: memberTheme.colors.primaryInk,
	},
	switch: {
		transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
	},
});
