import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import {
	Dimensions,
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';

interface InputCellProps {
	type: string;
	handleChange: (
		text: string | boolean,
		colIndex: number,
		qIndex: number,
		rowIndex: number,
	) => void;
	placeholder?: string;
	colIndex: number;
	qIndex: number;
	rowIndex: number;
	noborder?: boolean;
	focused?: boolean;
	value: unknown;
	handleSelectInput: (
		indexData: {
			qIndex: number;
			colIndex: number;
			rowIndex: number;
		} | null,
	) => void;
	selectItems: { label: string; value: string }[];
}

const InputCell = ({
	placeholder = '',
	noborder = false,
	type,
	value,
	handleChange,
	colIndex,
	qIndex,
	rowIndex,
	handleSelectInput,
	selectItems,
	focused,
}: InputCellProps) => {
	const textInputStyle = {
		...styles.inputTextStyle,
		borderBottomWidth: noborder ? 1 : 0,
	};

	const { height: deviceHeight } = Dimensions.get('screen');

	return (
		<View
			style={[
				noborder ? styles.cellStyleNoBorder : styles.cellStyle,
				styles.textInputContainer,
			]}
		>
			{type === 'text' && (
				<TextInput
					value={value as string}
					onChangeText={text =>
						handleChange(text, colIndex, qIndex, rowIndex)
					}
					placeholder={placeholder}
					placeholderTextColor={memberTheme.colors.textMuted}
					selectionColor={memberTheme.colors.primary}
					textAlign="center"
					style={[textInputStyle, layout.fontMontserratRegular]}
					allowFontScaling={false}
				/>
			)}

			{type === 'checkbox' && (
				<TouchableOpacity
					style={styles.inputCheckboxStyle}
					onPress={() =>
						handleChange(!value, colIndex, qIndex, rowIndex)
					}
				>
					{Boolean(value) && (
						<Icon
							name="check"
							style={styles.checkIconStyle}
							color={memberTheme.colors.primary}
						/>
					)}
				</TouchableOpacity>
			)}

			{type === 'select' && (
				<DropDownPicker
					onClose={() => handleSelectInput(null)}
					style={styles.dropdownStyle}
					listMode="MODAL"
					modalContentContainerStyle={styles.dropDownModalStyle}
					listItemContainerStyle={{
						borderBottomWidth: StyleSheet.hairlineWidth,
						borderColor: config.borders.colors.lightgrey,
						height: deviceHeight / 15,
					}}
					listItemLabelStyle={{ fontSize: config.fonts.metrics.md }}
					open={focused as boolean}
					value={value as string}
					items={selectItems}
					setOpen={() =>
						handleSelectInput({ colIndex, qIndex, rowIndex })
					}
					setValue={callback => {
						const newValue: string | boolean = callback(value) as
							| string
							| boolean;
						handleChange(newValue, colIndex, qIndex, rowIndex);
						handleSelectInput(null);
					}}
				/>
			)}

			{type === 'date' && (
				<TouchableOpacity
					onPress={() =>
						handleSelectInput({ colIndex, qIndex, rowIndex })
					}
					style={styles.datePickerStyle}
				>
					<Text size="md">
						{(value as string) || 'Select a date'}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

export default InputCell;

const styles = StyleSheet.create({
	cellStyle: {
		paddingHorizontal: 5,
		paddingVertical: 12,
		borderWidth: 1,
		flex: 1,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
	},
	cellStyleNoBorder: {
		paddingHorizontal: 5,
		paddingVertical: 12,
		flex: 1,
		height: '100%',
		justifyContent: 'center',
	},
	inputTextStyle: {
		width: '100%',
		color: memberTheme.colors.text,
		borderColor: memberTheme.colors.border,
	},
	textInputContainer: {
		alignItems: 'center',
	},
	inputCheckboxStyle: {
		borderRadius: memberTheme.radius.sm,
		borderWidth: 1,
		borderColor: memberTheme.colors.primary,
		backgroundColor: memberTheme.colors.surface,
		width: 30,
		height: 30,
		padding: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	checkIconStyle: {
		fontSize: 15,
		fontWeight: 'bold',
	},
	dropdownStyle: {
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.sm,
		zIndex: 2,
	},
	dropDownModalStyle: {
		marginTop: Platform.OS === 'android' ? 0 : '10%',
	},
	datePickerStyle: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingBottom: 11,
	},
});
