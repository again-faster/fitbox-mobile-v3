import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import { memberTheme } from '@/theme/member';
import { Constant } from '@/utils';
import { isEmpty } from 'lodash';
import {
	Image,
	ImageSourcePropType,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';

const CommentItem = ({
	comment,
	firstname,
	lastname,
	profile_image,
	right,
}: {
	comment: string;
	firstname: string;
	lastname: string;
	profile_image: string;
	right: boolean;
}) => {
	let tStyle: StyleProp<ViewStyle> = {
		...styles.triangleStyle,
	};

	if (right) {
		tStyle = {
			...styles.triangleStyle,
			right: Constant.DEVICEWIDTH / 40,
		};
	} else {
		tStyle = {
			...styles.triangleStyle,
			left: Constant.DEVICEWIDTH / 40,
		};
	}

	const alignSelf: StyleProp<ViewStyle> = {
		alignSelf: right ? 'flex-end' : 'flex-start',
	};

	const isGifUrl = (url: string) => {
		return /\.(gif)$/i.test(url);
	};

	const lines = comment.split('\n');
	const hasGIF = isGifUrl(lines[lines.length - 1] as string);
	const combinedString =
		lines.length > 1 && hasGIF
			? lines.slice(0, -1).join('\n')
			: lines.join('\n');

	return (
		<View style={styles.commentContainer}>
			<View style={[styles.boxStyle, alignSelf]}>
				{!isEmpty(combinedString) && (
					<Text size="rg" style={styles.commentText}>
						{combinedString}
					</Text>
				)}
				{hasGIF && (
					<Image
						source={{ uri: lines[lines.length - 1] }}
						style={styles.gifPreviewStyle}
					/>
				)}
				<View style={tStyle} />
			</View>
			<Spacer size="rg" />
			<Row style={alignSelf} align="center">
				<Avatar
					source={profile_image as ImageSourcePropType}
					style={{ marginRight: config.metrics.sm }}
					size={20}
				/>

				<Text size="sm" style={styles.authorText}>
					{firstname} {lastname}
				</Text>
			</Row>
		</View>
	);
};

const styles = StyleSheet.create({
	commentContainer: {
		marginBottom: memberTheme.spacing.lg,
	},
	boxStyle: {
		position: 'relative',
		backgroundColor: memberTheme.colors.surfaceSoft,
		paddingVertical: config.metrics.md,
		paddingHorizontal: config.metrics.lg,
		borderRadius: memberTheme.radius.md,
		maxWidth: '78%',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
	},
	triangleStyle: {
		width: 0,
		height: 0,
		borderLeftWidth: Constant.DEVICEWIDTH / 40,
		borderRightWidth: Constant.DEVICEWIDTH / 40,
		borderTopWidth: Constant.DEVICEHEIGHT / 60,
		borderStyle: 'solid',
		backgroundColor: 'transparent',
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: memberTheme.colors.surfaceSoft,
		position: 'absolute',
		bottom: -10,
	},
	gifPreviewStyle: {
		width: 170,
		height: 170,
		borderRadius: memberTheme.radius.sm,
		marginTop: memberTheme.spacing.sm,
	},
	commentText: {
		color: memberTheme.colors.text,
	},
	authorText: {
		color: memberTheme.colors.textMuted,
	},
});

export default CommentItem;
