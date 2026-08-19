import { useIsDesktop } from '@/hooks/use-desktop';

import IndexDesktop from './IndexDesktop';
import IndexMobile from './IndexMobile';

const Index = () => {
  const isDesktop = useIsDesktop();
  return isDesktop ? <IndexDesktop /> : <IndexMobile />;
};

export default Index;
