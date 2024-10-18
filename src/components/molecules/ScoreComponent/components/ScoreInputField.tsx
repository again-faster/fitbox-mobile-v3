import { Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { Constant } from '@/utils';
import { LegacyRef } from 'react';
import {
	StyleSheet,
	TextInput,
	TextInputProps,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { ScoreInputFieldHandlers, SessionSectionState } from '../types';

const ENABLE_SCORE_INPUT_LOGGING = true;

interface FieldInputProps extends TextInputProps {
	ref?: LegacyRef<TextInput>;
	title: string;
}

const FieldInput = ({
	title = '',
	value,
	onChangeText,
	...rest
}: FieldInputProps) => {
	const showBorder = !!onChangeText;

	if ((!value || value === '0') && !onChangeText) {
		return null;
	}

	const isLoadSameValue =
		value?.includes('-') &&
		value.split('-').every(val => val === value.split('-')[0]);

	const getFieldValue = (newValue: string) => {
		if (isLoadSameValue) {
			return newValue.split('-')[0];
		}

		return newValue;
	};

	return (
		<View
			style={[
				styles.inputFieldContainer,
				showBorder && styles.borderedContainer,
			]}
		>
			<Text size="rg" color="darkgray" style={styles.inputFieldTitle}>
				{title}
			</Text>

			{onChangeText ? (
				<TextInput
					style={styles.inputField}
					onChangeText={e => onChangeText(e)}
					value={value}
					{...rest}
					allowFontScaling={false}
				/>
			) : (
				<View style={[layout.fullWidth, layout.justifyCenter]}>
					{isLoadSameValue ? (
						<Text style={styles.superscript}>x</Text>
					) : null}

					<Text center style={styles.inputField}>
						{getFieldValue(value ?? '')}
					</Text>
				</View>
			)}
		</View>
	);
};

interface ScoreInputFieldProps {
	section: SessionSectionState;
	unitType?: string;
	method?: string;
	movementId: number | null;
	handler: ScoreInputFieldHandlers;
}

const ScoreInputField = ({
	section,
	unitType,
	method,
	movementId,
	handler,
}: ScoreInputFieldProps) => {
	const displayValue = movementId
		? section.movements[movementId]?.value
		: section.value;

	const displayReps = String(
		movementId ? section.movements[movementId]?.reps : section.reps,
	);

	if (ENABLE_SCORE_INPUT_LOGGING) {
		// eslint-disable-next-line no-console
		console.log(`InputField - unitType: ${unitType} - method: ${method}`);
	}

	if (unitType === 'load') {
		if (method === 'single') {
			return (
				<View style={styles.inputMainContainer}>
					{!!(section.rounds || section.sets) && (
						<FieldInput
							title={section.rounds ? 'Rounds' : 'Sets'}
							value={String(section.rounds ?? section.sets)}
						/>
					)}

					{!!(
						movementId &&
						section.reps &&
						!section.movements[movementId]?.reps
					) && <FieldInput title="Reps" value={section.reps} />}

					{!!(movementId && section.movements[movementId]?.reps) && (
						<FieldInput
							title="Reps"
							value={String(section.movements[movementId]?.reps)}
						/>
					)}

					<FieldInput
						title="Weight"
						value={displayValue}
						onChangeText={val => {
							handler.loadEntered(val, movementId, null);
						}}
					/>
				</View>
			);
		}

		if (method === 'sum') {
			const num = section.sets || section.rounds || 0;
			const name = section.sets === null ? 'Round' : 'Set';

			const totalFields = Array.from(Array(num).keys());

			// Prepare section reps
			const sectionReps = String(section.reps);

			return (
				<>
					{totalFields.map(field => {
						return (
							<View key={field} style={styles.inputMainContainer}>
								<FieldInput
									title={name}
									value={String(field + 1)}
								/>

								{sectionReps !== '' &&
								movementId &&
								!section.movements[movementId]?.reps ? (
									<FieldInput
										title="Reps"
										value={
											name === 'Set'
												? sectionReps.split('-')[field]
												: sectionReps
										}
									/>
								) : null}

								{sectionReps !== '' &&
								movementId &&
								section.movements[movementId]?.reps ? (
									<FieldInput
										title="Reps"
										value={
											name === 'Set'
												? sectionReps.split('-')[field]
												: sectionReps
										}
									/>
								) : null}

								<FieldInput
									title="Weight"
									ref={ref => handler.addToRefs(ref, field)}
									onSubmitEditing={() =>
										handler.focusToRef(field + 1)
									}
									keyboardType="numbers-and-punctuation"
									style={styles.inputField}
									value={
										movementId
											? section.movements[movementId]
													?.loads[field]
											: section.loads[field]
									}
									onChangeText={val => {
										handler.loadEntered(
											val,
											movementId,
											field,
										);
									}}
								/>
							</View>
						);
					})}
				</>
			);
		}
		if (method === 'multiply') {
			return (
				<View style={styles.inputMainContainer}>
					{/*
					// TEMP: On previous implementation, reps this is not used

					// Old implementation:
					<View
						style={[
							styles.inputFieldContainer,
							styles.borderedContainer,
						]}
					>
						<Text rg darkgray style={{ marginBottom: Metrics.sm }}>
							Reps
						</Text>
						<TextInput
							keyboardType="numbers-and-punctuation"
							style={styles.inputField}
						/>
					</View>
					// End of Old implementation:
					*/}

					<Text size="rg" style={styles.inputFieldTitle}>
						X
					</Text>

					<FieldInput
						title="Weight"
						keyboardType="numbers-and-punctuation"
						value={
							movementId
								? section.movements[movementId]?.value
								: section.value
						}
						onChangeText={val => {
							handler.loadEntered(val, movementId, null);
						}}
					/>
				</View>
			);
		}
	} else if (unitType === 'time') {
		if (method === 'single') {
			return (
				<View style={styles.inputMainContainer}>
					<FieldInput
						title="Minutes"
						keyboardType="numeric"
						value={displayValue?.split(':')[0] ?? ''}
						maxLength={2}
						onChangeText={val =>
							handler.minEntered(val, movementId, null)
						}
					/>

					<FieldInput
						title="Seconds"
						value={displayValue?.split(':')[1] ?? ''}
						keyboardType="numeric"
						maxLength={2}
						onChangeText={val =>
							handler.secEntered(val, movementId, null)
						}
					/>
				</View>
			);
		}
		if (method === 'sum') {
			const num = section.sets || section.rounds || 0;
			const name = section.sets === null ? 'Round' : 'Set';

			const totalFields = Array.from(Array(num).keys());
			return (
				<>
					{totalFields.map(field => {
						const fieldName = field;
						const nextFieldName = `next_${field}`;

						return (
							<View key={field} style={styles.inputMainContainer}>
								<FieldInput
									title={name}
									value={String(field + 1)}
								/>

								<FieldInput
									title="Minutes"
									ref={ref =>
										handler.addToRefs(ref, fieldName)
									}
									keyboardType="numeric"
									onChangeText={val => {
										handler.minEntered(
											val,
											movementId,
											field,
										);
									}}
									onSubmitEditing={() =>
										handler.focusToRef(nextFieldName)
									}
								/>

								<FieldInput
									title="Seconds"
									ref={ref =>
										handler.addToRefs(ref, nextFieldName)
									}
									keyboardType="numeric"
									onChangeText={val => {
										handler.secEntered(
											val,
											movementId,
											field,
										);
									}}
									onSubmitEditing={() =>
										handler.focusToRef(fieldName + 1)
									}
								/>
							</View>
						);
					})}
				</>
			);
		}
	} else if (unitType === 'reps') {
		if (section.scoring_type?.id === 8) {
			// if AMRAP = Rounds + Reps
			return (
				<View style={styles.inputMainContainer}>
					<FieldInput
						title="Rounds"
						keyboardType="numeric"
						value={displayValue}
						onChangeText={val => {
							handler.roundsOrDistanceEntered(val, movementId);
						}}
					/>

					<FieldInput
						title="Reps"
						keyboardType="numeric"
						value={displayReps?.toString()}
						onChangeText={reps => {
							handler.repsEntered(reps, movementId);
						}}
					/>
				</View>
			);
		}
		return (
			<View style={styles.inputMainContainer}>
				<FieldInput
					title="Reps"
					keyboardType="numeric"
					value={displayValue}
					onChangeText={val => {
						handler.roundsOrDistanceEntered(val, movementId);
					}}
				/>
			</View>
		);
	} else if (unitType === 'distance') {
		return (
			<View style={styles.inputMainContainer}>
				<FieldInput
					title="Distance"
					keyboardType="numbers-and-punctuation"
					value={displayValue}
					onChangeText={val => {
						handler.roundsOrDistanceEntered(val, movementId);
					}}
				/>
			</View>
		);
	} else if (unitType === 'yesno') {
		return (
			<View style={styles.inputMainContainer}>
				<View style={layout.itemsCenter}>
					<Text
						size="rg"
						color="darkgray"
						style={styles.inputFieldTitle}
					>
						Complete
					</Text>
					<Spacer />
					<TouchableOpacity
						onPress={() => {
							handler.checkboxClicked(movementId);
						}}
						style={styles.checkbox}
					>
						{displayValue === 'Yes' && (
							<Icon
								name="check"
								size={25}
								// eslint-disable-next-line react-native/no-inline-styles
								style={{ zIndex: 9 }}
								color={config.fonts.colors.info}
							/>
						)}
					</TouchableOpacity>
				</View>
			</View>
		);
	} else if (unitType === 'cal') {
		if (method === 'single') {
			return (
				<View style={styles.inputMainContainer}>
					<FieldInput
						title="Calories"
						keyboardType="numbers-and-punctuation"
						value={displayValue}
						onChangeText={val => {
							handler.roundsOrDistanceEntered(val, movementId);
						}}
					/>
				</View>
			);
		}
		if (method === 'sum') {
			const num =
				section.sets === null || section.sets === 0
					? section.rounds ?? 0
					: section.sets;
			const name = section.sets === null ? 'Round' : 'Set';

			const totalFields = Array.from(Array(num).keys());

			// Prepare section reps
			const sectionReps = String(section.reps);

			return (
				<>
					{totalFields.map(field => {
						return (
							<View key={field} style={styles.inputMainContainer}>
								<FieldInput
									title={name}
									value={String(field + 1)}
								/>

								{movementId &&
									sectionReps !== '' &&
									!section.movements[movementId]?.reps && (
										<FieldInput
											title="Reps"
											value={
												name === 'Set'
													? sectionReps.split('-')[
															field
													  ]
													: sectionReps
											}
										/>
									)}

								{sectionReps !== '' &&
									movementId &&
									section.movements[movementId]!.reps && (
										<FieldInput
											title="Reps"
											value={
												name === 'Set'
													? sectionReps.split('-')[
															field
													  ]
													: sectionReps
											}
										/>
									)}

								<FieldInput
									title="Calories"
									keyboardType="numbers-and-punctuation"
									ref={ref => handler.addToRefs(ref, field)}
									onSubmitEditing={() =>
										handler.focusToRef(field + 1)
									}
									onChangeText={val => {
										handler.loadEntered(
											val,
											movementId,
											field,
										);
									}}
									value={
										movementId
											? section.movements[movementId]!
													.loads[field]
											: section.loads[field]
									}
								/>
							</View>
						);
					})}
				</>
			);
		}
	}

	return null;
};

export default ScoreInputField;

const styles = StyleSheet.create({
	borderedContainer: {
		borderColor: config.fonts.colors.info,
		borderWidth: 1.5,
		borderRadius: 6,
	},
	inputFieldContainer: {
		width: '25%',
		alignItems: 'center',
	},
	inputFieldTitle: {
		marginBottom: config.metrics.sm,
	},
	inputMainContainer: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		alignItems: 'flex-start',
		marginTop: config.metrics.lg,
		marginBottom: config.metrics.rg,
	},
	inputField: {
		textAlign: 'center',
		width: '100%',
		paddingBottom: config.metrics.rg,
		padding: Constant.IS_ANDROID ? 0 : null,
		fontSize: config.fonts.metrics.h3,
		...layout.fontMontserratRegular,
	},
	checkbox: {
		borderRadius: 6,
		borderWidth: 1,
		borderColor: config.fonts.colors.info,
		width: 50,
		height: 50,
		padding: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	superscript: {
		position: 'absolute',
		fontSize: config.fonts.metrics.md,
		left: '-20%',
		bottom: '40%',
		color: 'gray',
		...layout.fontMontserratBold,
	},
});
