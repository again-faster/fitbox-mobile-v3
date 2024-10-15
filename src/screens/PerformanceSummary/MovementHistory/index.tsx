import { ScoreMovementComponent } from '@/components/molecules';
import useKeyboardVisibility from '@/hooks/useKeyboardVisibility';
import { getUserMovements } from '@/services/users';
import layout from '@/theme/layout';
import { PerformanceSummaryParamList } from '@/types/navigation';
import { PastPerformanceResultType } from '@/types/schemas/leaderboards';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import BottomSheet, { WINDOW_HEIGHT } from '@gorhom/bottom-sheet';
import { StackScreenProps } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MovementHistoryBS from './components/MovementHistoryBS';

const bottomSheetSpacing = WINDOW_HEIGHT * 0.3;

type MovementHistoryProps = StackScreenProps<
	PerformanceSummaryParamList,
	'MovementHistory'
>;

const MovementHistory = ({ route, navigation }: MovementHistoryProps) => {
	const { isKeyboardVisible } = useKeyboardVisibility();
	const queryClient = useQueryClient();
	const { movementId, name, addResult } = route.params;

	const [isLoading, setIsLoading] = useState(true);
	const [movements, setMovements] = useState<PastPerformanceResultType[]>([]);
	const [oneRm, setOneRm] = useState<number | null>(null);
	const [sheetIndex, setSheetIndex] = useState<number>(addResult ? 0 : 1);

	const sheetRef = useRef<BottomSheet>(null);

	const fetchDetails = () => {
		setIsLoading(true);

		void getUserMovements(movementId)
			.then(res => {
				if (!res.error) {
					setMovements(
						res.data.movements.reverse() as PastPerformanceResultType[],
					);

					if (res.data.one_rm) {
						setOneRm(parseInt(res.data.one_rm.weight, 10));
					}
				} else {
					Say.err('Something went wrong!');

					// Go back
					navigation.goBack();
				}
			})
			.catch(e => {
				Say.err(e as ICatchError);
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	const onSuccessCallback = () => {
		// Refetch the details
		fetchDetails();

		// Close the bottom sheet
		sheetRef.current?.expand();

		// remove the query
		void queryClient.removeQueries({
			queryKey: ['getPastPerformanceHistory'],
		});
	};

	useEffect(() => {
		fetchDetails();
	}, []);

	return (
		<View style={layout.flex_1}>
			<ScoreMovementComponent
				containerStyle={[
					layout.flex_1,
					!isKeyboardVisible && styles.containerExpanded,
				]}
				movementId={movementId}
				movementName={name}
				onSuccess={onSuccessCallback}
			/>

			{!isKeyboardVisible && (
				<MovementHistoryBS
					sheetRef={sheetRef}
					sheetIndex={sheetIndex}
					movements={movements}
					setSheetIndex={setSheetIndex}
					movementName={name}
					oneRm={oneRm || 0}
					bottomOffset={bottomSheetSpacing}
					isLoading={isLoading}
				/>
			)}
		</View>
	);
};

export default MovementHistory;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	containerExpanded: {
		marginBottom: bottomSheetSpacing,
	},
});
