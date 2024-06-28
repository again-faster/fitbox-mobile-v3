import { config } from '@/theme/_config';
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
}

const Card = ({ onPress, style, activeOpacity, children }: CardProps) => {
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

	return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: config.backgrounds.light,
		borderRadius: config.metrics.sm,
		padding: config.metrics.rg,
		marginVertical: config.metrics.xs,
		elevation: 2, // this only works on android
		shadowOffset: { width: 0.5, height: 0.5 },
		shadowColor: 'black',
		shadowOpacity: 0.2,
	},
});

export default Card;
