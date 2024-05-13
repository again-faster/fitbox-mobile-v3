import { resetRoot } from '@/navigators/NavigationRef';
import { mmkvStorage } from '@/storage';
import { Say } from '@/utils';
import ky from 'ky';

const prefixUrl = `${process.env.API_URL ? process.env.API_URL : ''}`;
const xAppVersion = `${process.env.APP_VERSION ? process.env.APP_VERSION : ''}`;
const apiToken = () => mmkvStorage.getString('apiToken');

export const instance = () =>
	ky.extend({
		prefixUrl,
		headers: {
			Accept: 'application/json',
		},
		signal: undefined,
	});

export const securedInstance = () =>
	ky.extend({
		prefixUrl,
		searchParams: {
			api_key: apiToken() || '',
		},
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'x-app-version': xAppVersion,
		},
		hooks: {
			beforeRequest: [
				request => {
					// eslint-disable-next-line no-console
					console.log('@request', request.url.toString());

					// TODO: additional headers
					// request.headers.set('X-Requested-With', 'ky');
				},
			],
			afterResponse: [
				(_, __, response) => {
					// if status code is 401, remove api token and logout
					if (response.status === 401) {
						// remove api token and user data
						mmkvStorage.clearAll();

						// Say error navigate to login
						Say.err('Unauthorized access, please login again!');

						// Go to startup
						resetRoot();
					}
				},
			],
		},
	});
