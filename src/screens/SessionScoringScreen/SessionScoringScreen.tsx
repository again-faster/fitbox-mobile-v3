import { Button, Text } from '@/components/atoms';
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
import { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { fonts } = config;

const bottomSheetSpacing = Dimensions.get('window').height * 0.3;

const SessionScoringScreen = ({ route }: ApplicationScreenProps) => {
	const { section, sessionId } = route.params as ScoringParams;
	const { isKeyboardVisible } = useKeyboardVisibility();

	// Prepare state variables
	const [isLoadingHistory, setLoadingHistory] = useState(true);
	const [results, setResults] = useState<{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		section_scores?: any[];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		user_movement?: any[];
	}>({});
	const [isBottomSheetOpen, setBottomSheetOpen] = useState(false);
	const bottomSheetRef = useRef<BottomSheet>(null);

	const handleOpenBottomSheet = () => {
		bottomSheetRef.current?.expand(); // Use 'expand' to open it to the first snap point that isn't '0%'
		setBottomSheetOpen(true);
	};

	const handleCloseBottomSheet = () => {
		bottomSheetRef.current?.close(); // This closes the bottom sheet completely
		setBottomSheetOpen(false);
	};

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

	useEffect(() => {
		if (isKeyboardVisible) {
			handleCloseBottomSheet();
		}
	}, [isKeyboardVisible]);

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

	const renderScoreComponent = useMemo(
		() => (
			<View style={layout.flex_1}>
				<View style={[styles.workoutScoreContainer]}>
					<ScoreComponent
						sessionId={sessionId}
						section={section}
						onSubmitCallback={() => void fetchDetails()}
						editMode={false}
					/>
				</View>
			</View>
		),
		[sessionId, section],
	);

	const renderBottomSheet = useMemo(
		() => (
			<BottomSheet
				ref={bottomSheetRef}
				index={-1}
				snapPoints={
					isKeyboardVisible ? ['1%'] : [bottomSheetSpacing, '60%']
				}
				backgroundStyle={styles.pastPerformanceContainer}
				animateOnMount={false}
				backdropComponent={renderBackdrop}
				enableDynamicSizing={false}
				enablePanDownToClose
				onClose={handleCloseBottomSheet}
			>
				<Icon
					name="arrow-down"
					size={20}
					color={config.backgrounds.brand}
					// eslint-disable-next-line react-native/no-inline-styles
					style={{
						marginLeft: config.metrics.xs,
						alignSelf: 'center',
					}}
					onPress={handleCloseBottomSheet}
				/>
				<BottomSheetScrollView>
					<WODPastPerformance
						isLoading={isLoadingHistory}
						section={section}
						results={results}
					/>
				</BottomSheetScrollView>
			</BottomSheet>
		),
		[isKeyboardVisible, isLoadingHistory, section, results],
	);

	const renderBottomSheetButton = useMemo(
		() =>
			((results?.section_scores?.length ?? 0) > 0 ||
				(results?.user_movement?.length ?? 0) > 0) &&
			!isKeyboardVisible && (
				<Button
					title={
						isBottomSheetOpen
							? 'Close Past Performance'
							: 'View Past Performance'
					}
					onPress={
						isBottomSheetOpen
							? handleCloseBottomSheet
							: handleOpenBottomSheet
					}
					style={styles.bottomSheetButton}
				/>
			),
		[isBottomSheetOpen, isKeyboardVisible, results],
	);

	const scoringBy = section.scoring_by;
	if (scoringBy === 'section' || scoringBy === 'movement') {
		return (
			<>
				{renderScoreComponent}
				{renderBottomSheetButton}
				{renderBottomSheet}
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
	bottomSheetButton: {
		margin: config.metrics.rg,
		marginTop: -config.metrics.sm,
	},
});
