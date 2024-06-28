import { Text } from '@/components/atoms';
import { FontColors, FontSizeMetrics } from '@/components/atoms/Text/Text';
import { config } from '@/theme/_config';
import { ActivityIndicator as AC, StyleSheet, View } from 'react-native';

interface LoaderProps {
	color?: FontColors;
	size?: FontSizeMetrics | number;
	text?: string;
	cover?: boolean;
}

const Loader = ({
	color = 'brand',
	size = config.fonts.metrics.lg,
	cover = false,
	text,
}: LoaderProps) => {
	const useSize: number =
		typeof size === 'number' ? size : config.fonts.metrics[size];

	const renderLoader = (
		<>
			<AC color={color} size={useSize} animating />

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

export default Loader;

const styles = StyleSheet.create({
	cover: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
