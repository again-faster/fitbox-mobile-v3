import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ThemeProvider } from '@/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-native-paper';
import AuthProvider from './auth/AuthProvider/AuthProvider';
import ApplicationNavigator from './navigators/Application';
import { mmkvStorage } from './storage';
import './translations';

const queryClient = new QueryClient();

// eslint-disable-next-line react/function-component-definition
function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider storage={mmkvStorage}>
				<ThemeProvider storage={mmkvStorage}>
					<Provider>
						<ApplicationNavigator />
					</Provider>
				</ThemeProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;
