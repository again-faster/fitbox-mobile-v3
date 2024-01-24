import { useEffect, useState } from 'react';
import {
	Image,
	ImageSourcePropType,
	ImageStyle,
	StyleProp,
} from 'react-native';

import DefaultAvatar from '@/theme/assets/images/default_avatar.png';

type AvatarProps = {
	source?: ImageSourcePropType;
	size?: number;
	style?: StyleProp<ImageStyle>;
};

const Avatar = ({ size, source, style }: AvatarProps) => {
	const [src, setSrc] = useState<ImageSourcePropType>(
		source as ImageSourcePropType,
	);

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

	return (
		<Image
			onError={() => setSrc(DefaultAvatar as ImageSourcePropType)}
			style={[{ width, height, borderRadius }, style as ImageStyle]}
			source={src}
		/>
	);
};

Avatar.defaultProps = {
	source: DefaultAvatar as ImageSourcePropType,
	size: 50,
	style: {},
};

export default Avatar;
