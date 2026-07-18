import { Constant } from '@/utils';
import ky from 'ky';
import { clearWSSession, getValidWSToken } from './auth';
import { toWSApiError } from './errors';

const TIMEOUT_MS = 15_000;

const client = ky.create({
	prefixUrl: `${Constant.WS_SUPABASE_URL}/rest/v1/`,
	timeout: TIMEOUT_MS,
	retry: {
		limit: 2,
		methods: ['get'],
		statusCodes: [408, 429, 500, 502, 503, 504],
	},
	hooks: {
		beforeRequest: [
			async request => {
				const token = await getValidWSToken();
				if (token)
					request.headers.set('Authorization', `Bearer ${token}`);
				request.headers.set('apikey', Constant.WS_SUPABASE_ANON_KEY);
				request.headers.set('Content-Type', 'application/json');
			},
		],
		afterResponse: [
			(_request, _options, response) => {
				if (response.status === 401) void clearWSSession();
			},
		],
	},
});

export const wsApi = () => client;

export const wsRpc = async <T>(
	fn: string,
	params: Record<string, unknown> = {},
): Promise<T> => {
	try {
		return await client
			.post(`rpc/${fn}`, { json: params, retry: 0 })
			.json<T>();
	} catch (error) {
		throw await toWSApiError(error);
	}
};
