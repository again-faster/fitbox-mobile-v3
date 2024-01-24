import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import {
	ActivityIndicator as AC,
	ColorValue,
	StyleSheet,
	View,
} from 'react-native';

interface LoaderProps {
	color?: ColorValue;
	size?: number;
	text?: string;
	cover?: boolean;
}

const Loader = ({ color, size, text, cover }: LoaderProps) => {
	const renderLoader = (
		<>
			<AC color={color} size={size} animating />

			{text && (
				<Text center color="darkgray">
					{text}
				</Text>
			)}
		</>
	);

	// if fullpage cover use prop 'cover'
	if (cover) return <View style={styles.cover}>{renderLoader}</View>;

	return renderLoader;
};

Loader.defaultProps = {
	color: config.fonts.colors.brand,
	size: config.fonts.metrics.lg,
	text: undefined,
	cover: false,
};

export default Loader;

const styles = StyleSheet.create({
	cover: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
