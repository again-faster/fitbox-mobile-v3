import { Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
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
				<View style={styles.oneRmHeader}>
					<Text bold style={styles.eyebrow}>
						Your 1RM
					</Text>
					<Spacer size="sm" />
					<Text bold size="lg" style={styles.weightText}>
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
					<Text center bold style={styles.percentageHeading}>
						Your percentages
					</Text>
					<Spacer size="sm" />
					<Row style={styles.titleContainer}>
						<Text bold size="lg" style={styles.resultText}>
							{result.replace('.00', '')}kg
						</Text>
						<Spacer horizontal size="xs" />
						<Text size="lg" style={styles.percentText}>
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
		marginHorizontal: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.lg,
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.lg,
		backgroundColor: memberTheme.colors.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
		...memberTheme.shadow,
	},
	titleContainer: {
		justifyContent: 'center',
		marginBottom: config.metrics.sm,
	},
	selectedStyle: {
		backgroundColor: memberTheme.colors.primary,
	},
	unselectedStyle: {
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	trackStyle: {
		height: 12,
		borderRadius: 12,
	},
	markerStyle: {
		width: 21,
		height: 15,
		backgroundColor: memberTheme.colors.primaryInk,
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
	oneRmHeader: {
		alignSelf: 'flex-start',
	},
	eyebrow: {
		color: memberTheme.colors.primary,
	},
	weightText: {
		color: memberTheme.colors.text,
	},
	percentageHeading: {
		color: memberTheme.colors.text,
	},
	resultText: {
		color: memberTheme.colors.text,
	},
	percentText: {
		color: memberTheme.colors.textMuted,
	},
});
