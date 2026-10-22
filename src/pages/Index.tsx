import { Suspense } from 'react';
import { useIsDesktop } from '@/hooks/use-desktop';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

const IndexDesktop = lazyWithRetry(() => import('./IndexDesktop'));
const IndexMobile = lazyWithRetry(() => import('./IndexMobile'));

const IndexFallback = () => (
  <div className="min-h-dvh flex items-center justify-center bg-background" />
);

const Index = () => {
  const isDesktop = useIsDesktop();
  return (
    <Suspense fallback={<IndexFallback />}>
      {isDesktop ? <IndexDesktop /> : <IndexMobile />}
    </Suspense>
  );
};

export default Index;
