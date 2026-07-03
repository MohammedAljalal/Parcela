import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// TanStack Query v5 removed per-query `onError` from useQuery — error handling
// now happens centrally via QueryCache/MutationCache instead. Mutations still
// get their own onError in each call site for contextual messages; this is a
// silent fallback so a failed background refetch doesn't go unnoticed.
const isAuthRoute = (key) => Array.isArray(key) && (key[0] === 'me' || key[0] === 'auth');

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Auth bootstrap failures are already handled by AuthContext; avoid double-toasting.
      if (isAuthRoute(query.queryKey)) return;
      console.error('Query failed:', query.queryKey, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('Mutation failed:', error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
