import { Button, Text } from '@/components/atoms';
import { ScoreComponent } from '@/components/molecules';
import WODPastPerformance from '@/components/molecules/WODPastPerformance/WODPastPerformance';
import useKeyboardVisibility from '@/hooks/useKeyboardVisibility';
import { goBack } from '@/navigators/NavigationRef';
import { getPastPerformance } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { ApplicationScreenProps, ScoringParams } from '@/types/navigation';
import { Func } from '@/utils';
import useStore from '@/zustand/Store';
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useFocusEffect } from '@react-navigation/native';
import { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, StyleSheet, View } from 'react-native';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const bottomSheetSpacing = Dimensions.get('window').height * 0.3;

const SessionScoringScreen = ({ route }: ApplicationScreenProps) => {
	const { section, sessionId } = route.params as ScoringParams;
	const { isKeyboardVisible } = useKeyboardVisibility();

	const { setScoringBottomSheet } = useStore(state => ({
		setScoringBottomSheet: state.setScoringBottomSheet,
	}));

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

	useEffect(() => {
		setScoringBottomSheet(isBottomSheetOpen);
	}, [isBottomSheetOpen]);

	const handleOpenBottomSheet = () => {
		Keyboard.dismiss();
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
			<View style={[layout.flex_1, styles.screen]}>
				<View style={[styles.workoutScoreContainer]}>
					<ScoreComponent
						sessionId={sessionId}
						section={section}
						onSubmitCallback={() => void fetchDetails()}
						editMode={false}
						fromCalendar
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
					color={memberTheme.colors.primary}
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

	const marginBottomValue =
		Func.isAndroid15OrLater() || Platform.OS === 'ios' ? '75%' : '0%';

	const renderBottomSheetButton = useMemo(
		() => (
			<View
				style={{
					marginBottom: marginBottomValue,
				}}
			>
				{((results?.section_scores?.length ?? 0) > 0 ||
					(results?.user_movement?.length ?? 0) > 0) && (
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
				)}
			</View>
		),
		[isBottomSheetOpen, results, isKeyboardVisible],
	);

	const scoringBy = section.scoring_by;
	if (scoringBy === 'section' || scoringBy === 'movement') {
		return (
			<>
				<View style={styles.screen}>{renderScoreComponent}</View>
				{renderBottomSheetButton}
				{renderBottomSheet}
			</>
		);
	}

	return (
		<View style={[layout.flex_1, styles.screen, styles.invalidState]}>
			<Text size="lg" center style={styles.invalidText}>
				This workout cannot be scored yet.
			</Text>
			<Text center style={styles.invalidHint}>
				Ask your coach to check the scoring setup for this section.
			</Text>
		</View>
	);
};

export default SessionScoringScreen;

const styles = StyleSheet.create({
	workoutScoreContainer: {
		flex: 1,
	},
	screen: {
		backgroundColor: memberTheme.colors.background,
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
		borderTopLeftRadius: memberTheme.radius.lg,
		borderTopRightRadius: memberTheme.radius.lg,
		borderTopWidth: 1,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
	},
	bottomSheetButton: {
		margin: config.metrics.rg,
		marginTop: -config.metrics.sm,
		borderRadius: memberTheme.radius.pill,
	},
	invalidState: {
		justifyContent: 'center',
		padding: memberTheme.spacing.xl,
	},
	invalidText: {
		color: memberTheme.colors.text,
		marginBottom: memberTheme.spacing.sm,
	},
	invalidHint: {
		color: memberTheme.colors.textMuted,
	},
});
