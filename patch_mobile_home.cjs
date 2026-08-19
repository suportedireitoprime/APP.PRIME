const fs = require('fs');
const file = 'src/components/vademecum/MobileHomeSections.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import DocumentosSheet from '@/components/documentos/DocumentosSheet';", "const DocumentosSheet = lazy(() => import('@/components/documentos/DocumentosSheet'));");
content = content.replace("import JurisprudenciaSheet from './JurisprudenciaSheet';", "const JurisprudenciaSheet = lazy(() => import('./JurisprudenciaSheet'));");
content = content.replace("import VoiceCaptureOverlay from './VoiceCaptureOverlay';", "const VoiceCaptureOverlay = lazy(() => import('./VoiceCaptureOverlay'));");
content = content.replace("import HomeNoticiasCarousel from './HomeNoticiasCarousel';", "const HomeNoticiasCarousel = lazy(() => import('./HomeNoticiasCarousel'));");
content = content.replace("import AprendaSobreLeis from './AprendaSobreLeis';", "const AprendaSobreLeis = lazy(() => import('./AprendaSobreLeis'));");
content = content.replace("import NoticiasJuridicasCarousel from './NoticiasJuridicasCarousel';", "const NoticiasJuridicasCarousel = lazy(() => import('./NoticiasJuridicasCarousel'));");

content = content.replace("<HomeNoticiasCarousel onOpenChange={onNewsOpenChange} autoplay={noticiasAutoplay} />", "<Suspense fallback={<div className=\"h-48 bg-muted/20 animate-pulse rounded-xl mx-4\" />}><HomeNoticiasCarousel onOpenChange={onNewsOpenChange} autoplay={noticiasAutoplay} /></Suspense>");

content = content.replace("<AprendaSobreLeis titleClassName=\"px-4 sm:px-6 md:px-8 lg:px-12\" />", "<Suspense fallback={<div className=\"h-32 bg-muted/20 animate-pulse rounded-xl mx-4 mt-8\" />}><AprendaSobreLeis titleClassName=\"px-4 sm:px-6 md:px-8 lg:px-12\" /></Suspense>");

content = content.replace("<NoticiasJuridicasCarousel />", "<Suspense fallback={<div className=\"h-64 bg-muted/20 animate-pulse rounded-xl mx-4\" />}><NoticiasJuridicasCarousel /></Suspense>");

content = content.replace("<JurisprudenciaSheet open={juriOpen} onClose={() => setJuriOpen(false)} />", "{juriOpen && <Suspense fallback={null}><JurisprudenciaSheet open={juriOpen} onClose={() => setJuriOpen(false)} /></Suspense>}");

content = content.replace("<DocumentosSheet categoria={docPasta} open={!!docPasta} onClose={() => setDocPasta(null)} />", "{docPasta && <Suspense fallback={null}><DocumentosSheet categoria={docPasta} open={!!docPasta} onClose={() => setDocPasta(null)} /></Suspense>}");

content = content.replace("<VoiceCaptureOverlay", "<Suspense fallback={null}><VoiceCaptureOverlay");
content = content.replace("onStop={onVoiceCommand}\n      />", "onStop={onVoiceCommand}\n      /></Suspense>");

fs.writeFileSync(file, content);
console.log('MobileHomeSections patched.');
