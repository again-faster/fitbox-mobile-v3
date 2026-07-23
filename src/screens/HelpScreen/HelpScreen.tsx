import { Text } from '@/components/atoms';
import { memberTheme } from '@/theme/member';
import { Constant } from '@/utils';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const HelpScreen = () => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<View style={styles.container}>
			<View style={styles.headerCard}>
				<View style={styles.headerIcon}>
					<Icon
						name="lifebuoy"
						size={25}
						color={memberTheme.colors.primaryDeep}
					/>
				</View>
				<View style={styles.headerCopy}>
					<Text bold style={styles.headerTitle}>
						How can we help?
					</Text>
					<Text style={styles.headerText}>
						Find answers and guidance from the fitbox help centre.
					</Text>
				</View>
			</View>
			<View style={styles.webCard}>
				{isLoading && (
					<View style={styles.loaderStyle}>
						<ActivityIndicator
							color={memberTheme.colors.primaryDeep}
							size="large"
						/>
						<Text style={styles.loadingText}>
							Loading help centre…
						</Text>
					</View>
				)}
				<WebView
					style={styles.webView}
					source={{ uri: Constant.HELP_URL }}
					onLoad={() => setIsLoading(false)}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: memberTheme.colors.background,
		flex: 1,
		padding: memberTheme.spacing.lg,
	},
	headerCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.lg,
		flexDirection: 'row',
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
	},
	headerIcon: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.md,
		height: 48,
		justifyContent: 'center',
		width: 48,
	},
	headerCopy: { flex: 1, marginLeft: memberTheme.spacing.md },
	headerTitle: { color: memberTheme.colors.ink, fontSize: 18 },
	headerText: {
		color: memberTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 17,
		marginTop: 4,
	},
	webCard: {
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		flex: 1,
		overflow: 'hidden',
	},
	webView: { flex: 1 },
	loaderStyle: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		bottom: 0,
		justifyContent: 'center',
		left: 0,
		position: 'absolute',
		right: 0,
		top: 0,
		zIndex: 2,
	},
	loadingText: {
		color: memberTheme.colors.textMuted,
		fontSize: 13,
		marginTop: memberTheme.spacing.md,
	},
});

export default HelpScreen;
