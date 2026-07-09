/**
 * Utility to prefetch a lazy-loaded component
 * @param importFn The dynamic import function (e.g., () => import('./pages/Dashboard'))
 */
export const prefetchPage = (importFn: () => Promise<unknown>) => {
  const prefetchPromise = importFn();
  prefetchPromise.catch(() => {
    // Ignore errors during prefetch, they will be handled during actual navigation
  });
};
