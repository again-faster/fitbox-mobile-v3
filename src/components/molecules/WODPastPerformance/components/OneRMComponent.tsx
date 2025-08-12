import { Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

interface OneRmComponent {
	weight: number; // value of one rm (kg)
	noHeader?: boolean; // if true, it will not show the header
	initialPercentage?: number;
	setPercentage?: (percentage: number) => void; // callback to set percentage
}

const OneRMComponent = ({
	weight,
	noHeader = false,
	initialPercentage = 75,
	setPercentage,
}: OneRmComponent) => {
	const [percent, setPercent] = useState<number>(initialPercentage);

	const trackOptions = {
		min: 0,
		max: 100,
	};

	const result = ((percent / 100) * weight).toFixed(2);
	return (
		<View style={styles.mainCon}>
			{!noHeader && (
				<View style={[layout.itemsCenter, layout.selfStart]}>
					<Text style={{ color: config.fonts.colors.brand }}>
						Your 1RM
					</Text>
					<Spacer size="sm" />
					<Text bold color="darkgray">
						{weight} kg
					</Text>
				</View>
			)}
			<Spacer />
			{noHeader ? (
				<Row style={styles.titleContainer}>
					<Text size="lg" color="mute">
						Percentage:
					</Text>
					<Spacer horizontal size="xs" />
					<Text bold size="lg" color="darkgray">
						{percent}%
					</Text>
				</Row>
			) : (
				<>
					<Text center bold>
						Your percentages
					</Text>
					<Spacer size="sm" />
					<Row style={styles.titleContainer}>
						<Text bold size="lg" color="darkgray">
							{result.replace('.00', '')}kg
						</Text>
						<Spacer horizontal size="xs" />
						<Text size="lg" color="mute">
							({percent}%)
						</Text>
					</Row>
				</>
			)}
			<View style={layout.itemsCenter}>
				<MultiSlider
					onValuesChange={values => {
						setPercent(values[0] as number);
						setPercentage?.(values[0] as number);
					}}
					pressedMarkerStyle={styles.pressedMarkerStyle}
					unselectedStyle={styles.unselectedStyle}
					selectedStyle={styles.selectedStyle}
					markerStyle={styles.markerStyle}
					trackStyle={styles.trackStyle}
					sliderLength={width / 1.25}
					max={trackOptions.max}
					min={trackOptions.min}
					values={[percent]}
					markerOffsetY={6}
					step={5}
				/>
			</View>
		</View>
	);
};

export default OneRMComponent;

const styles = StyleSheet.create({
	mainCon: {
		paddingHorizontal: 15,
		marginBottom: config.metrics.lg,
	},
	titleContainer: {
		justifyContent: 'center',
		marginBottom: config.metrics.sm,
	},
	selectedStyle: {
		backgroundColor: config.fonts.colors.brand,
	},
	unselectedStyle: {
		backgroundColor: config.fonts.colors.brand,
	},
	trackStyle: {
		height: 12,
		borderRadius: 12,
	},
	markerStyle: {
		width: 21,
		height: 15,
		backgroundColor: '#3C3C3C',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 0,
		},
		borderWidth: 0,
	},
	pressedMarkerStyle: {
		height: 15,
	},
});
