import { memberTheme } from '@/theme/member';
import type { PropsWithChildren } from 'react';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';
import {
	StyleSheet,
	View,
	type StyleProp,
	type ViewStyle,
} from 'react-native';

type MemberScreenProps = PropsWithChildren<{
	style?: StyleProp<ViewStyle>;
	contentContainerStyle?: StyleProp<ViewStyle>;
	testID?: string;
	edges?: Edges;
}>;

const MemberScreen = ({ children, style, contentContainerStyle, testID, edges }: MemberScreenProps) => (
	<SafeAreaView testID={testID} edges={edges} style={[styles.screen, style]}>
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
