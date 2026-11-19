import React, { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { getMateriaMeta } from './data/pilulasMateriasConfig';

const PilulasMateria = lazy(() => import('./PilulasMateria'));
const PilulasDireitoPenal = lazy(() => import('./PilulasDireitoPenal'));
const PilulasPlayer = lazy(() => import('./PilulasPlayer'));

export default function PilulasSlugDispatcher() {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const targetId = slug || id || '';

  const meta = getMateriaMeta(targetId);

  if (meta) {
    if (meta.slug === 'direito-penal') {
      return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
          <PilulasDireitoPenal />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
        <PilulasMateria />
      </Suspense>
    );
  }

  // Se não for uma matéria das 23, trata como pílula de clássico/audiolivro
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <PilulasPlayer />
    </Suspense>
  );
}
