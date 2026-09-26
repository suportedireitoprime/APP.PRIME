import { lazy, Suspense } from 'react';
import { useIsDesktop } from '@/hooks/use-desktop';

const IndexDesktop = lazy(() => import('./IndexDesktop'));
const IndexMobile = lazy(() => import('./IndexMobile'));

const IndexFallback = () => (
  <div className="min-h-dvh flex items-center justify-center bg-[#0D0D0D]">
    <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
  </div>
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
