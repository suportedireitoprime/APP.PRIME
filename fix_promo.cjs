const fs = require('fs');
const path = require('path');

// 1. App.tsx
const appPath = 'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');

if (!appContent.includes('GlobalPromoFloatingCard')) {
  appContent = appContent.replace(
    `import { GlobalDelayedPrompts } from "@/components/GlobalDelayedPrompts";`,
    `import { GlobalDelayedPrompts } from "@/components/GlobalDelayedPrompts";\nimport { GlobalPromoFloatingCard } from "@/components/GlobalPromoFloatingCard";`
  );
  
  appContent = appContent.replace(
    `<GlobalDelayedPrompts />`,
    `<GlobalDelayedPrompts />\n          <GlobalPromoFloatingCard />`
  );
  fs.writeFileSync(appPath, appContent);
}

// 2. Onboarding.tsx
const obPath = 'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/pages/Onboarding.tsx';
let obContent = fs.readFileSync(obPath, 'utf8');

obContent = obContent.replace(
  `import { HorusPromoModal } from '@/components/assinatura/HorusPromoModal';\n`,
  ``
);

const finalizarOld = `  const finalizar = useCallback(() => {
    // Marca o onboarding como concluído no fluxo e apresenta a promoção exclusiva
    setTimeLeft(calculatePromoTimeLeft());
    setOnboardingFinished(true);
    setPedirPromo(true);
  }, [calculatePromoTimeLeft]);`;

const finalizarNew = `  const finalizar = useCallback(() => {
    // Marca o onboarding como concluído no fluxo e vai direto para o trial
    setOnboardingFinished(true);
    setPedirTrial(true);
  }, []);`;

obContent = obContent.replace(finalizarOld, finalizarNew);

// Remover HorusPromoModal block
obContent = obContent.replace(/{pedirPromo.*?<HorusPromoModal.*?onRedeem={resgatarPromo}\s*\/>\s*}/s, '');

// Fallback if not found:
if (obContent.includes('<HorusPromoModal')) {
    obContent = obContent.replace(/<HorusPromoModal[\s\S]*?\/>/, '');
}

fs.writeFileSync(obPath, obContent);
console.log('Fixed Onboarding and App');
