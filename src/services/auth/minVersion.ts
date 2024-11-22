import { GetMinVersionSchema } from '@/types/schemas/response';
import { Constant } from '@/utils';
import ky from 'ky';

export default async () => {
	const response = await ky.get(Constant.MIN_VERSION_URL).json();

	return GetMinVersionSchema.parse(response);
};
