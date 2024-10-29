import { AuthConfiguration } from 'react-native-app-auth';

const authConfig: AuthConfiguration = {
	issuer: 'https://login.microsoftonline.com/360754e8-3226-4832-b83d-9885d51d6821/v2.0',
	clientId: '5be50370-2da0-421d-8ac8-9e70d61ab3f8',
	redirectUrl: 'appfitbox://auth',
	scopes: ['openid', 'profile', 'email', 'offline_access'],
	additionalParameters: { prompt: 'select_account' },
	serviceConfiguration: {
		authorizationEndpoint:
			'https://devfitbox.ciamlogin.com/360754e8-3226-4832-b83d-9885d51d6821/oauth2/v2.0/authorize',
		tokenEndpoint:
			'https://devfitbox.ciamlogin.com/360754e8-3226-4832-b83d-9885d51d6821/oauth2/v2.0/token',
	},
};

export default authConfig;
