import { useEffect, useState } from 'react';
import {
	Image,
	ImageSourcePropType,
	ImageStyle,
	StyleProp,
} from 'react-native';

import DefaultAvatar from '@/theme/assets/images/default_avatar.png';

type AvatarProps = {
	source?: ImageSourcePropType | string;
	size?: number;
	style?: StyleProp<ImageStyle>;
};

const Avatar = ({
	size = 50,
	source = DefaultAvatar as ImageSourcePropType,
	style = {},
}: AvatarProps) => {
	const [src, setSrc] = useState<ImageSourcePropType | null>(null);

	const width = Number(size);
	const height = Number(size);
	let borderRadius = 0;

	useEffect(() => {
		if (source) {
			setSrc({
				// workaround for the image server issues
				uri: String(source).replace(
					'https://fitbox.iq',
					'http://13.72.224.232',
				),
				headers: {
					Pragma: 'no-cache',
				},
			});
		} else {
			setSrc(DefaultAvatar as ImageSourcePropType);
		}
	}, []);

	borderRadius = height > width ? height / 2 : width / 2;

	return src ? (
		<Image
			onError={() => setSrc(DefaultAvatar as ImageSourcePropType)}
			style={[{ width, height, borderRadius }, style as ImageStyle]}
			source={src}
		/>
	) : null;
};

export default Avatar;
