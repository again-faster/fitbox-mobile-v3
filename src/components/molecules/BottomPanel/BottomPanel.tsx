import { HR, Row, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import React from 'react';
import {
	DimensionValue,
	Modal,
	Platform,
	SafeAreaView,
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
	ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

type BottomPanelProps = {
	visible: boolean;
	onClose: () => void;
	backButton?: boolean;
	rightTitle?: React.ReactNode;
	title?: string;
	noMask?: boolean;
	style?: StyleProp<ViewStyle>;
	children: React.ReactNode;
	maxHeight?: DimensionValue;
};

const BottomPanel = ({
	backButton = false,
	noMask = false,
	maxHeight = '70%',
	visible,
	onClose,
	rightTitle,
	title,
	style,
	children,
}: BottomPanelProps) => {
	const isAndroid = Platform.OS === 'android';

	const customStyle: StyleProp<ViewStyle> = {
		backgroundColor: noMask ? 'transparent' : 'rgba(0,0,0,0.3)',
	};
	return (
		<Modal
			animationType={isAndroid ? 'fade' : 'none'}
			transparent
			visible={visible}
		>
			<SafeAreaView
				style={{
					...styles.modalContainer,
					...customStyle,
				}}
			>
				<TouchableWithoutFeedback onPress={onClose}>
					<View style={styles.backgroundView} />
				</TouchableWithoutFeedback>
				<View style={[styles.modalStyle, style, { maxHeight }]}>
					{title && (
						<>
							<Row
								spacing="space-between"
								style={{ padding: config.metrics.lg }}
							>
								<Row align="center">
									{backButton && (
										<TouchableOpacity
											onPress={onClose}
											style={{
												marginRight: config.metrics.md,
											}}
										>
											<Icon
												name="arrow-left"
												size={config.fonts.metrics.md}
											/>
										</TouchableOpacity>
									)}
									<Text size="lg" style={styles.title}>
										{title}
									</Text>
								</Row>
								{rightTitle}
							</Row>
							<HR />
						</>
					)}
					{children}
				</View>
			</SafeAreaView>
		</Modal>
	);
};

export default BottomPanel;

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	modalStyle: {
		backgroundColor: 'white',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
		elevation: 8,
	},
	title: {
		fontFamily: 'Alata-Regular',
	},
	backgroundView: {
		flex: 1,
	},
});
