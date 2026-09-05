import { pickAsset, srcOf } from '@/lib/assetUrl';

import cover2Asset from '@/assets/covers/cover-2.png.asset.json';
import cover2Bundled from '@/assets/covers/cover-2.webp';
import cover3Asset from '@/assets/covers/cover-3.png.asset.json';
import cover3Bundled from '@/assets/covers/cover-3.webp';
import cover4Asset from '@/assets/covers/cover-4.png.asset.json';
import cover4Bundled from '@/assets/covers/cover-4.webp';
import cover5Asset from '@/assets/covers/cover-5.png.asset.json';
import cover5Bundled from '@/assets/covers/cover-5.webp';
import cover6Asset from '@/assets/covers/cover-6.png.asset.json';
import cover6Bundled from '@/assets/covers/cover-6.webp';
import cover7Asset from '@/assets/covers/cover-7.png.asset.json';
import cover7Bundled from '@/assets/covers/cover-7.webp';
import cover8Asset from '@/assets/covers/cover-8.png.asset.json';
import cover8Bundled from '@/assets/covers/cover-8.webp';
import cover9Asset from '@/assets/covers/cover-9.png.asset.json';
import cover9Bundled from '@/assets/covers/cover-9.webp';
import cover10Asset from '@/assets/covers/cover-10.png.asset.json';
import cover10Bundled from '@/assets/covers/cover-10.webp';

export const FALLBACK_COVERS = [
  { url: pickAsset(cover2Bundled, srcOf(cover2Asset)), preset: 'ken-burns' as const },
  { url: pickAsset(cover3Bundled, srcOf(cover3Asset)), preset: 'ken-burns' as const },
  { url: pickAsset(cover4Bundled, srcOf(cover4Asset)), preset: 'ken-burns' as const },
  { url: pickAsset(cover5Bundled, srcOf(cover5Asset)), preset: 'ken-burns' as const },
  { url: pickAsset(cover6Bundled, srcOf(cover6Asset)), preset: 'ken-burns' as const },
  { url: pickAsset(cover7Bundled, srcOf(cover7Asset)), preset: 'ken-burns' as const },
  { url: pickAsset(cover8Bundled, srcOf(cover8Asset)), preset: 'ken-burns' as const },
  { url: pickAsset(cover9Bundled, srcOf(cover9Asset)), preset: 'ken-burns' as const },
  { url: pickAsset(cover10Bundled, srcOf(cover10Asset)), preset: 'ken-burns' as const },
];

export const toOptimized = (url: string): string => {
  try {
    if (!url) return url;
    if (url.includes('/storage/v1/object/public/')) {
      const opt = url.replace('/object/public/', '/render/image/public/');
      const sep = opt.includes('?') ? '&' : '?';
      return `${opt}${sep}width=1024&quality=78&format=origin`;
    }
    return url;
  } catch {
    return url;
  }
};
