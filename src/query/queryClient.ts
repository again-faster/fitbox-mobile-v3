import { QueryClient } from '@tanstack/react-query';
import { QUERY_GC_TIME } from './cachePolicy';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: QUERY_GC_TIME,
		},
	},
});

export default queryClient;
