import { memberTheme } from '@/theme/member';
import type { PropsWithChildren } from 'react';
import {
	SafeAreaView,
	StyleSheet,
	View,
	type StyleProp,
	type ViewStyle,
} from 'react-native';

type MemberScreenProps = PropsWithChildren<{
	style?: StyleProp<ViewStyle>;
	contentContainerStyle?: StyleProp<ViewStyle>;
	testID?: string;
}>;

const MemberScreen = ({ children, style, contentContainerStyle, testID }: MemberScreenProps) => (
	<SafeAreaView testID={testID} style={[styles.screen, style]}>
		<View style={[styles.content, contentContainerStyle]}>{children}</View>
	</SafeAreaView>
);

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
	},
	content: {
		flex: 1,
		paddingHorizontal: memberTheme.surfaces.screenGutter,
	},
});

export default MemberScreen;
