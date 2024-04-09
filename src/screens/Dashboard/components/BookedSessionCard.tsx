import { Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ParsedSessionSchemaType } from '@/types/schemas/session';
import moment from 'moment';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { metrics, fonts } = config;

interface BookedSessionCardProps {
	data: ParsedSessionSchemaType;
	onPress: () => void;
}

const BookedSessionCard = ({ data, onPress }: BookedSessionCardProps) => {
	return (
		<TouchableOpacity style={styles.container} onPress={onPress}>
			<Row style={layout.flex_1}>
				<View style={layout.justifyCenter}>
					<Text bold size="sm" color="mute" center>
						{moment(data.start_time).format('DD MMM')}
					</Text>
					<Text size="sm" color="mute" center>
						{moment(data.start_time).format('ddd')}
					</Text>
				</View>

				<Spacer horizontal />

				<View style={layout.flex_1}>
					<Text bold size="md" numberOfLines={2}>
						{data.name}
					</Text>
					<Text size="sm">
						{moment(data.start_time).format('h:mmA')} -{' '}
						{moment(data.end_time).format('h:mmA')}
					</Text>
				</View>
			</Row>

			<Spacer horizontal size="xs" />

			<Icon
				name="arrow-right"
				color={fonts.colors.gray200}
				size={fonts.metrics.md}
				style={{ marginRight: metrics.sm }}
			/>
		</TouchableOpacity>
	);
};

export default BookedSessionCard;

const styles = StyleSheet.create({
	container: {
		backgroundColor: fonts.colors.light,
		flexDirection: 'row',
		paddingVertical: metrics.rg,
		paddingHorizontal: metrics.rg,
		alignItems: 'center',
	},
	warningTxt: {
		color: '#595959',
		textAlign: 'center',
		maxWidth: 100,
	},
	btnOutline: {
		borderColor: fonts.colors.darkgray,
		borderWidth: 1,
		width: 'auto',
	},
});
