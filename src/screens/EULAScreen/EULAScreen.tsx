/* eslint-disable no-console */
import useAuth from '@/auth/hooks/useAuth';
import { Button, Row, Spacer } from '@/components/atoms';
import { getEula } from '@/services/eula';
import acceptEula from '@/services/eula/acceptEula';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationScreenProps } from '@/types/navigation';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

type StateTypes = {
	eula: string;
	accepting: boolean;
	loading: boolean;
};

const EULAScreen = ({ navigation }: ApplicationScreenProps) => {
	const { user, updateUser, signOut } = useAuth();
	const [state, setState] = useState<StateTypes>({
		eula: '',
		accepting: false,
		loading: true,
	});

	useEffect(() => {
		void (async () => {
			try {
				const res = await getEula();
				const decodedHtml = res.eula;
				setState({ ...state, eula: decodedHtml, loading: false });
			} catch (e) {
				console.log('e: ', e);
			}
		})();
	}, []);

	const handleDecline = () => {
		signOut();
		navigation.reset({
			index: 0,
			routes: [{ name: 'Landing' }],
		});
	};

	const handleAccept = async () => {
		try {
			if (state.accepting) return false;

			setState({ ...state, accepting: true });
			const res = await acceptEula();

			if (res.error) {
				Alert.alert(res.message);
				return false;
			}
			const userData = user?.user_data;
			if (userData) {
				userData.eula_accepted = true;
				updateUser(userData);
				navigation.navigate('Startup');
			}
			return true;
		} catch (e) {
			setState({ ...state, accepting: false });
			Alert.alert('Something went wrong');
			return false;
		}
	};

	const htmlContent = `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif;
          font-size: 14px;
          color: #333;
          line-height: 1.6;
        }

        h2 {
          font-size: 20px;
          margin-top: 24px;
          margin-bottom: 12px;
          font-weight: bold;
        }

        ul, ol {
          margin: 8px 0 8px 12px;
          padding-left: 12px;
        }

        li {
          margin: 4px 0;
        }

        ol li::marker {
          font-weight: bold;
          font-size: 14px;
        }

        strong {
          font-weight: bold;
        }

        .underlined {
          text-decoration: underline;
        }

        .heavy p {
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      ${state.eula}
    </body>
  </html>
`;

	return state.loading ? (
		<View style={styles.loaderStyle}>
			<ActivityIndicator color={config.colors.brand} size="large" />
		</View>
	) : (
		<View style={styles.eulaContainerStyle}>
			<WebView
				originWhitelist={['*']}
				source={{ html: htmlContent }}
				style={layout.flex_1}
				showsVerticalScrollIndicator={false}
			/>

			<Spacer />

			<Row spacing="center">
				<View style={layout.flex_1}>
					<Button
						title="Decline"
						style={{ backgroundColor: config.colors.danger }}
						onPress={handleDecline}
					/>
				</View>
				<Spacer horizontal size="xl" />
				<View style={layout.flex_1}>
					<Button
						title="Accept"
						style={{ backgroundColor: config.colors.success }}
						onPress={() => void handleAccept()}
						loading={state.accepting}
					/>
				</View>
			</Row>
		</View>
	);
};

const styles = StyleSheet.create({
	eulaContainerStyle: {
		flex: 1,
		padding: config.metrics.lg,
	},
	loaderStyle: {
		flex: 1,
		justifyContent: 'center',
	},
	baseStyle: {
		fontSize: 16,
		lineHeight: 24,
		color: '#333',
	},
});

export default EULAScreen;
