import { resetRoot } from '@/navigators/NavigationRef';
import { mmkvStorage } from '@/storage';
import { Constant } from '@/utils';
import ky from 'ky';
import DeviceInfo from 'react-native-device-info';
import SimpleToast from 'react-native-simple-toast';

/**
 * Get the API token from the storage
 */
const xAppVersion = `${DeviceInfo.getVersion()}-(${DeviceInfo.getBuildNumber()})`;

/**
 * Get the API token from the storage
 * @returns API Token
 */
export const getApiToken = () =>
	Constant.MASQUERADE_USER_API_TOKEN || mmkvStorage.getString('apiToken');

/**
 * Get the API URL from the storage
 * @returns API URL
 */
export const getApiUrl = () => mmkvStorage.getString('apiUrl');

const url = getApiUrl();
const getTimeout = () => {
	if (url?.includes('dev.fitbox.iq')) {
		return Constant.RESPONSE_TIMEOUT.DEV;
	}
	if (url?.includes('staging.fitbox.iq')) {
		return Constant.RESPONSE_TIMEOUT.STG;
	}
	if (url?.includes('fitbox.iq')) {
		return Constant.RESPONSE_TIMEOUT.PROD;
	}
	return Constant.RESPONSE_TIMEOUT.PROD;
};

/**
 * Create a new instance of ky
 * @returns KyInstance
 */
export const instance = () =>
	ky.extend({
		prefixUrl: getApiUrl() || Constant.API_URL,
		headers: {
			Accept: 'application/json',
		},
		signal: undefined,
	});

/**
 * Create a new instance of ky with secured headers
 * @returns KyInstance
 */
export const securedInstance = (timeout?: number) =>
	ky.extend({
		prefixUrl: getApiUrl() || Constant.API_URL,
		searchParams: {
			api_key: getApiToken() || '',
		},
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'x-app-version': xAppVersion,
		},
		timeout: timeout || getTimeout(),
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
						SimpleToast.show(
							'Unauthorized access, please login again!',
							SimpleToast.SHORT,
						);

						// Go to startup
						resetRoot();
					}
				},
			],
		},
	});
