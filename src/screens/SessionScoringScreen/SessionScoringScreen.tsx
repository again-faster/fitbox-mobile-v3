import { Text } from '@/components/atoms';
import { ScoreComponent } from '@/components/molecules';
import WODPastPerformance from '@/components/molecules/WODPastPerformance/WODPastPerformance';
import useKeyboardVisibility from '@/hooks/useKeyboardVisibility';
import { goBack } from '@/navigators/NavigationRef';
import { getPastPerformance } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationScreenProps, ScoringParams } from '@/types/navigation';
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useFocusEffect } from '@react-navigation/native';
import { JSX, useCallback, useEffect, useState } from 'react';
import {
	Dimensions,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import SimpleToast from 'react-native-simple-toast';

const { fonts } = config;

const bottomSheetSpacing = Dimensions.get('window').height * 0.3;

const SessionScoringScreen = ({ route }: ApplicationScreenProps) => {
	const { isKeyboardVisible } = useKeyboardVisibility();
	const { section, sessionId } = route.params as ScoringParams;

	// Prepare state variables
	const [isExpanded, setExpanded] = useState(false);
	const [isLoadingHistory, setLoadingHistory] = useState(true);
	const [results, setResults] = useState({});

	const fetchDetails = () =>
		getPastPerformance(section.id)
			.then(res => {
				if (!res.error) {
					setResults(res.data);
				} else {
					SimpleToast.show(res.message, SimpleToast.SHORT);
					goBack();
				}

				setLoadingHistory(false);
			})
			.catch(() => {
				SimpleToast.show(
					'Failed to fetch workout history',
					SimpleToast.SHORT,
				);
			});

	useEffect(() => {
		// trigger fetch details
		void fetchDetails();

		return () => {
			// clear workout state
			setResults({});
		};
	}, []);

	useFocusEffect(
		useCallback(() => {
			void fetchDetails();
		}, []),
	);

	const renderBackdrop = useCallback(
		(props: JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
			<BottomSheetBackdrop {...props} pressBehavior="collapse" />
		),
		[],
	);

	const scoringBy = section.scoring_by;
	if (scoringBy === 'section' || scoringBy === 'movement') {
		return (
			<>
				<View style={layout.flex_1}>
					<View
						style={[
							styles.workoutScoreContainer,
							!isKeyboardVisible &&
								styles.workoutScoreContainerExpanded,
						]}
					>
						<ScoreComponent
							sessionId={sessionId}
							section={section}
							onSubmitCallback={() => void fetchDetails()}
							independentScoring={false}
							editMode={false}
						/>

						{isExpanded && (
							<TouchableWithoutFeedback
								onPress={() => setExpanded(false)}
							>
								<View style={styles.backdropBackground} />
							</TouchableWithoutFeedback>
						)}
					</View>
				</View>

				{!isKeyboardVisible && (
					<BottomSheet
						snapPoints={[bottomSheetSpacing, '90%']}
						backgroundStyle={styles.pastPerformanceContainer}
						animateOnMount={false}
						backdropComponent={renderBackdrop}
					>
						{/* TODO: instad of putting scrollview add it under the list so it wouldnt affect the onerm */}
						<BottomSheetScrollView>
							<WODPastPerformance
								isLoading={isLoadingHistory}
								section={section}
								results={results}
							/>
						</BottomSheetScrollView>
					</BottomSheet>
				)}
			</>
		);
	}

	return (
		<Text
			color="darkgray"
			size="lg"
			center
			style={{ marginTop: fonts.metrics.xl }}
		>
			Invalid workout
		</Text>
	);
};

export default SessionScoringScreen;

const styles = StyleSheet.create({
	workoutScoreContainer: {
		flex: 1,
	},
	workoutScoreContainerExpanded: {
		marginBottom: bottomSheetSpacing,
	},
	backdropBackground: {
		backgroundColor: 'rgba(0,0,0,0.5)',
		height: '100%',
		width: '100%',
		position: 'absolute',
	},
	pastPerformanceContainer: {
		borderRadius: 0,
		borderTopWidth: 1,
		borderColor: config.fonts.colors.gray200,
	},
});
