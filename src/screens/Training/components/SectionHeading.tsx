import { StyleSheet, Text, View } from 'react-native';
import { trainingTheme } from '@/theme/training';

type Props = {
	title: string;
	action?: string;
};

const SectionHeading = ({ title, action }: Props) => (
	<View style={styles.row}>
		<Text style={styles.title}>{title}</Text>
		{action ? <Text style={styles.action}>{action}</Text> : null}
	</View>
);

const styles = StyleSheet.create({
	row: {
		minHeight: trainingTheme.touchTarget,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	title: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 17,
		fontWeight: '700',
		letterSpacing: -0.2,
	},
	action: {
		color: trainingTheme.colors.primary,
		fontFamily: 'Inter-Variable',
		fontSize: 13,
		fontWeight: '600',
	},
});

export default SectionHeading;
