import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import React from 'react';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';

interface CardProps {
	onPress?: () => void;
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	activeOpacity?: number;
	elevated?: boolean;
}

const Card = ({
	onPress,
	style,
	activeOpacity,
	children,
	elevated,
}: CardProps) => {
	const opacity = activeOpacity || 0.5;
	if (onPress) {
		return (
			<TouchableOpacity
				onPress={onPress}
				style={[styles.container, style]}
				activeOpacity={opacity}
			>
				{children}
			</TouchableOpacity>
		);
	}

	return (
		<View
			style={[styles.container, style, elevated && layout.shadowMedium]}
		>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: config.backgrounds.light,
		borderRadius: config.metrics.sm,
		padding: config.metrics.rg,
		marginVertical: config.metrics.xs,
	},
});

export default Card;
