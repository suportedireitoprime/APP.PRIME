/**
 * Catálogo de transferência de app.
 *
 * Reúne TUDO que precisa ganhar um valor novo quando este app for clonado
 * para outra marca/nome. Cada item diz: valor atual (o original deste app),
 * onde ele vive e o que fazer para trocar.
 *
 * Tipos:
 *  - `arquivo`         → está versionado no repositório; dá para trocar por find/replace
 *  - `secret-github`   → GitHub → Settings → Secrets and variables → Actions
 *  - `secret-supabase` → Secrets das Edge Functions (backend)
 *  - `painel-externo`  → só pode ser criado no painel do provedor (Apple, Google, Meta…)
 */

export type TransferKind = 'arquivo' | 'secret-github' | 'secret-supabase' | 'painel-externo';

export type TransferItem = {
  /** chave estável (usada para salvar o valor novo) */
  key: string;
  label: string;
  /** valor atual deste app; `null` quando é segredo/não versionado */
  atual: string | null;
  kind: TransferKind;
  /** arquivos versionados onde o valor aparece */
  arquivos?: string[];
  /** onde criar / como obter o valor novo */
  comoObter: string;
  obrigatorio?: boolean;
  /** true quando NÃO basta substituir texto (precisa gerar credencial nova) */
  naoSubstituivel?: boolean;
};

export type TransferGroup = {
  id: string;
  titulo: string;
  desc: string;
  itens: TransferItem[];
};

export const TRANSFER_GROUPS: TransferGroup[] = [
  {
    id: 'identidade',
    titulo: 'Identidade do app',
    desc: 'Nome, package/bundle e esquema de deep link',
    itens: [
      {
        key: 'android_app_id',
        label: 'Package Android (appId)',
        atual: 'br.com.direitoprime.app',
        kind: 'arquivo',
        obrigatorio: true,
        arquivos: [
          'capacitor.config.ts',
          'android-config/google-services.json',
          'public/workflows/build-android.yml',
          'src/generated/workflows/build-android.yml',
          'public/workflows/build-ios.yml',
          'src/generated/workflows/build-ios.yml',
          'public/.well-known/assetlinks.json',
          'public/.well-known/apple-app-site-association',
          'ios-export-options.plist',
          'src/hooks/useAuth.tsx',
          'src/lib/nativeDeepLinks.ts',
          'src/lib/nativeAlarm.ts',
          'src/lib/fbPixel.ts',
          'src/pages/SmartLink.tsx',
          'src/pages/AdminAppleCsr.tsx',
          'src/pages/AdminSecretsDownload.tsx',
          'src/components/auth/DesktopQrLogin.tsx',
          'src/components/vademecum/AvaliarAppSheet.tsx',
          'src/data/lojasSteps.ts',
          'MOBILE.md',
          'docs/APPLE_DEVELOPER.md',
          'docs/HANDOFF_IA.md',
          'android-config/FACEBOOK_SDK.md',
        ],
        comoObter: 'Você escolhe. Formato reverso do domínio, ex.: br.com.novamarca.app. Precisa ser único na Play Store.',
      },
      {
        key: 'ios_bundle_id',
        label: 'Bundle ID iOS',
        atual: 'app.vacatio (GoogleService-Info.plist) / br.com.direitoprime.app (export options e AASA)',
        kind: 'arquivo',
        obrigatorio: true,
        arquivos: [
          'ios-config/GoogleService-Info.plist',
          'ios-export-options.plist',
          'public/.well-known/apple-app-site-association',
          'public/workflows/build-ios.yml',
          'src/generated/workflows/build-ios.yml',
        ],
        comoObter:
          '⚠️ Hoje há divergência: o Firebase iOS usa app.vacatio e o restante usa br.com.direitoprime.app. Ao transferir, padronize UM valor e registre em Apple Developer → Identifiers.',
      },
      {
        key: 'app_name',
        label: 'Nome do app (appName / manifest / título)',
        atual: 'Direito Prime — Vade Mecum 2026',
        kind: 'arquivo',
        obrigatorio: true,
        arquivos: ['capacitor.config.ts', 'public/site.webmanifest', 'index.html'],
        comoObter: 'Nome comercial do novo app (exibido no launcher e nas lojas).',
      },
      {
        key: 'deeplink_scheme',
        label: 'Esquema de deep link (direitoprime://)',
        atual: 'direitoprime://',
        kind: 'arquivo',
        arquivos: ['src/lib/nativeDeepLinks.ts', 'public/workflows/build-android.yml', 'capacitor.config.ts'],
        comoObter: 'Você escolhe. Use o slug da nova marca em minúsculas, sem espaço.',
      },
      {
        key: 'dominio_publico',
        label: 'Domínio público do site',
        atual: 'direitoprime.com.br',
        kind: 'arquivo',
        obrigatorio: true,
        arquivos: [
          'index.html',
          'public/robots.txt',
          'public/sitemap.xml',
          'scripts/generate-sitemap.ts',
          'src/lib/nativeDeepLinks.ts',
          'src/lib/artigoPdf.ts',
          'src/lib/jurisPdf.ts',
          'src/lib/peticaoPdf.ts',
          'src/lib/artigoImage.ts',
          'src/pages/SuportePublico.tsx',
          'src/pages/ExcluirContaPublico.tsx',
          'src/pages/DesktopPromo.tsx',
          'docs/PLAY_DATA_SAFETY.md',
        ],
        comoObter: 'Domínio novo (precisa hospedar /.well-known/assetlinks.json e apple-app-site-association).',
      },
      {
        key: 'storage_prefix',
        label: 'Prefixo das chaves locais (direitoprime:*)',
        atual: 'direitoprime:',
        kind: 'arquivo',
        arquivos: ['src/lib/pushPermission.ts', 'src/lib/* (diversos)'],
        comoObter: 'Opcional. Trocar evita colisão se os dois apps forem instalados no mesmo aparelho/navegador.',
      },
    ],
  },
  {
    id: 'firebase',
    titulo: 'Firebase / Google Cloud',
    desc: 'Push, Analytics, Crashlytics e login Google',
    itens: [
      {
        key: 'firebase_project_id',
        label: 'Firebase projectId',
        atual: 'vactio-vade-mecum',
        kind: 'arquivo',
        obrigatorio: true,
        arquivos: [
          'src/lib/firebaseConfig.ts',
          'android-config/google-services.json',
          'ios-config/GoogleService-Info.plist',
          'public/firebase-messaging-sw.js',
        ],
        comoObter: 'console.firebase.google.com → criar projeto novo.',
      },
      {
        key: 'firebase_sender_id',
        label: 'messagingSenderId / project number',
        atual: '833040915353',
        kind: 'arquivo',
        obrigatorio: true,
        arquivos: [
          'src/lib/firebaseConfig.ts',
          'android-config/google-services.json',
          'ios-config/GoogleService-Info.plist',
          'capacitor.config.ts',
          'src/hooks/useAuth.tsx',
          'MOBILE.md',
        ],
        comoObter: 'Firebase → Configurações do projeto → Geral (número do projeto).',
      },
      {
        key: 'firebase_web_app_id',
        label: 'Firebase appId (web)',
        atual: '1:833040915353:web:2b66d20dfd752da0099108',
        kind: 'arquivo',
        arquivos: ['src/lib/firebaseConfig.ts', 'public/firebase-messaging-sw.js'],
        comoObter: 'Firebase → Configurações → Seus apps → App Web.',
      },
      {
        key: 'firebase_web_api_key',
        label: 'Firebase apiKey (web)',
        atual: 'AIzaSyD0RZQxyxvFByXiRp0wtQySms_VQ6aeFUk',
        kind: 'arquivo',
        arquivos: ['src/lib/firebaseConfig.ts'],
        comoObter: 'Firebase → Configurações → Seus apps → App Web (chave pública, pode ficar no bundle).',
      },
      {
        key: 'ga4_measurement_id',
        label: 'GA4 measurementId',
        atual: 'G-86C6ZMZLQM',
        kind: 'arquivo',
        arquivos: ['src/lib/analytics.ts', 'src/lib/firebaseConfig.ts', 'index.html'],
        comoObter: 'Google Analytics → Admin → Fluxos de dados → ID de métricas.',
      },
      {
        key: 'vapid_public_key',
        label: 'Chave pública VAPID (web push)',
        atual: 'BCSQWHdeiU_VBtz7AmS9LbLo34ALfubN4ZK1ud1xwrni35luGxR3EMbam8Oo4SPDUt_FI-6uuLFheJCE5r0nFns',
        kind: 'arquivo',
        arquivos: ['src/lib/firebaseConfig.ts', 'src/lib/vapid.ts'],
        comoObter: 'Firebase → Cloud Messaging → Certificados push da Web. A chave privada correspondente vai nos secrets.',
        naoSubstituivel: true,
      },
      {
        key: 'google_web_client_id',
        label: 'OAuth Web Client ID (login Google)',
        atual: '833040915353-t4op5194chqh14kbig98h0pe8c0j8irq.apps.googleusercontent.com',
        kind: 'arquivo',
        obrigatorio: true,
        arquivos: ['capacitor.config.ts', 'src/hooks/useAuth.tsx', 'android-config/google-services.json'],
        comoObter: 'Google Cloud → APIs e Serviços → Credenciais → OAuth client (tipo Web). Também vai no secret GOOGLE_WEB_CLIENT_ID e no provedor Google do Supabase Auth.',
      },
      {
        key: 'google_android_client_id',
        label: 'OAuth Android Client ID',
        atual: '833040915353-gkvhq1b2f4d1aou1mkd1nshhlubgvrdk.apps.googleusercontent.com',
        kind: 'arquivo',
        arquivos: ['android-config/google-services.json', 'capacitor.config.ts'],
        comoObter: 'Google Cloud → Credenciais → OAuth client (Android), com o package novo e o SHA-1 do keystore novo.',
        naoSubstituivel: true,
      },
      {
        key: 'fcm_service_account',
        label: 'FCM_SERVICE_ACCOUNT_JSON',
        atual: null,
        kind: 'secret-supabase',
        obrigatorio: true,
        comoObter: 'Firebase → Configurações → Contas de serviço → Gerar nova chave privada (JSON). Cole inteiro no secret.',
        naoSubstituivel: true,
      },
    ],
  },
  {
    id: 'android',
    titulo: 'Android — assinatura e build',
    desc: 'Keystore, SHA-256 e App Links',
    itens: [
      {
        key: 'android_keystore',
        label: 'ANDROID_KEYSTORE_BASE64',
        atual: null,
        kind: 'secret-github',
        obrigatorio: true,
        comoObter: 'Gerar keystore novo (keytool) e subir em base64. Cada app tem o seu — não reaproveite.',
        naoSubstituivel: true,
      },
      { key: 'android_keystore_password', label: 'ANDROID_KEYSTORE_PASSWORD', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Senha do keystore novo.', naoSubstituivel: true },
      { key: 'android_key_alias', label: 'ANDROID_KEY_ALIAS', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Alias definido ao criar o keystore.', naoSubstituivel: true },
      { key: 'android_key_password', label: 'ANDROID_KEY_PASSWORD', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Senha da chave dentro do keystore.', naoSubstituivel: true },
      {
        key: 'android_sha256',
        label: 'SHA-256 do keystore de release (App Links)',
        atual: 'REPLACE_WITH_RELEASE_SHA256_FINGERPRINT',
        kind: 'arquivo',
        obrigatorio: true,
        arquivos: ['public/.well-known/assetlinks.json', 'public/.well-known/assetlinks.json.template'],
        comoObter: 'Play Console → Configuração → Integridade do app → Assinatura de apps (SHA-256), ou keytool -list -v no keystore.',
        naoSubstituivel: true,
      },
      {
        key: 'android_cert_hash',
        label: 'certificate_hash (SHA-1) do google-services.json',
        atual: '93453d4ef11927bb061945d8260dd67ea849815c',
        kind: 'arquivo',
        arquivos: ['android-config/google-services.json'],
        comoObter: 'SHA-1 do keystore novo, cadastrado no app Android do Firebase (baixe o google-services.json novo pronto).',
        naoSubstituivel: true,
      },
    ],
  },
  {
    id: 'apple',
    titulo: 'Apple — conta, certificados e build',
    desc: 'Team ID, App Store Connect e assinatura',
    itens: [
      {
        key: 'apple_team_id',
        label: 'APPLE_TEAM_ID',
        atual: 'REPLACE_WITH_TEAM_ID (ainda não preenchido no AASA)',
        kind: 'secret-github',
        obrigatorio: true,
        arquivos: ['public/.well-known/apple-app-site-association', 'ios-export-options.plist'],
        comoObter: 'developer.apple.com → Membership → Team ID (10 caracteres).',
      },
      { key: 'apple_bundle_id_secret', label: 'APPLE_BUNDLE_ID (secret)', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Mesmo bundle registrado em Apple Developer → Identifiers. Também existe como secret no Supabase (validação de compras).' },
      { key: 'apple_id', label: 'APPLE_ID', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'E-mail da conta Apple Developer usada no upload.' },
      { key: 'apple_app_specific_password', label: 'APPLE_APP_SPECIFIC_PASSWORD', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'appleid.apple.com → Segurança → Senhas específicas do app.', naoSubstituivel: true },
      { key: 'asc_issuer_id', label: 'APPLE_APP_STORE_CONNECT_ISSUER_ID', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'App Store Connect → Usuários e acesso → Integrações → Chaves da API.' },
      { key: 'asc_key_id', label: 'APPLE_APP_STORE_CONNECT_KEY_ID', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Mesma tela das chaves da API (Key ID).' },
      { key: 'asc_key_p8', label: 'APPLE_APP_STORE_CONNECT_KEY_P8_BASE64', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Baixe o .p8 (só é possível uma vez) e converta em base64.', naoSubstituivel: true },
      { key: 'apple_dist_cert', label: 'APPLE_DISTRIBUTION_CERT_P12_BASE64 + senha', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Certificado de distribuição da nova conta, exportado em .p12 e convertido em base64 (use /admin-apple-csr).', naoSubstituivel: true },
      { key: 'apple_provisioning', label: 'APPLE_PROVISIONING_PROFILE_BASE64', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Provisioning profile de App Store gerado para o bundle novo, em base64.', naoSubstituivel: true },
    ],
  },
  {
    id: 'billing',
    titulo: 'Assinaturas e pagamentos',
    desc: 'Play Billing, In-App Purchase e cobrança',
    itens: [
      { key: 'android_package_name_secret', label: 'ANDROID_PACKAGE_NAME (secret Supabase)', atual: 'br.com.direitoprime.app', kind: 'secret-supabase', obrigatorio: true, comoObter: 'Mesmo package novo — usado pela função validate-purchase para validar compras do Play.' },
      { key: 'play_service_account', label: 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON', atual: null, kind: 'secret-supabase', obrigatorio: true, comoObter: 'Google Cloud → conta de serviço com acesso à API do Play Developer + convite no Play Console.', naoSubstituivel: true },
      { key: 'play_pubsub_token', label: 'GOOGLE_PLAY_PUBSUB_VERIFICATION_TOKEN', atual: null, kind: 'secret-supabase', comoObter: 'Play Console → Monetização → Notificações em tempo real (token que você define).' },
      { key: 'play_product_ids', label: 'IDs dos produtos/assinaturas do Play', atual: null, kind: 'painel-externo', obrigatorio: true, arquivos: ['supabase/functions/validate-purchase/index.ts'], comoObter: 'Play Console → Produtos → Assinaturas. IDs atuais: prime_premium_mensal (R$ 29,90/mês) e prime_premium_anual (R$ 199,90/ano).' },
      { key: 'apple_product_ids', label: 'IDs dos produtos in-app (Apple)', atual: null, kind: 'painel-externo', obrigatorio: true, comoObter: 'App Store Connect → Assinaturas. Precisam bater com os IDs validados no backend.' },
    ],
  },
  {
    id: 'backend',
    titulo: 'Backend (Supabase)',
    desc: 'Projeto, chaves e URL pública',
    itens: [
      { key: 'supabase_project_id', label: 'VITE_SUPABASE_PROJECT_ID', atual: 'dnjrgpldcwcpoywamorr', kind: 'arquivo', obrigatorio: true, arquivos: ['.env', 'src/integrations/supabase/client.ts', 'supabase/config.toml'], comoObter: 'Ao remixar no Lovable, um projeto Cloud novo é criado automaticamente. Se usar Supabase próprio, pegue o ref no dashboard.' },
      { key: 'supabase_url', label: 'VITE_SUPABASE_URL / SUPABASE_URL', atual: 'https://dnjrgpldcwcpoywamorr.supabase.co', kind: 'arquivo', obrigatorio: true, arquivos: ['.env'], comoObter: 'URL do projeto novo (também vira secret no GitHub Actions).' },
      { key: 'supabase_publishable', label: 'VITE_SUPABASE_PUBLISHABLE_KEY', atual: '(anon key do projeto atual)', kind: 'arquivo', obrigatorio: true, arquivos: ['.env'], comoObter: 'Supabase → Project Settings → API. É pública, pode ficar no bundle.' },
      { key: 'supabase_service_role', label: 'SUPABASE_SERVICE_ROLE_KEY', atual: null, kind: 'secret-github', obrigatorio: true, comoObter: 'Supabase → API → service_role. Nunca no cliente.', naoSubstituivel: true },
      { key: 'public_site_url', label: 'PUBLIC_SITE_URL', atual: null, kind: 'secret-supabase', comoObter: 'URL pública do app novo (usada em e-mails e links das edge functions).' },
      { key: 'admin_emails', label: 'ADMIN_DOWNLOAD_EMAILS / lista de admins', atual: null, kind: 'secret-supabase', arquivos: ['src/lib/adminEmails.ts'], comoObter: 'E-mails dos administradores do novo app.' },
    ],
  },
  {
    id: 'horus',
    titulo: 'Horus / WhatsApp (Evolution API)',
    desc: 'Instância, tokens e webhook do assistente',
    itens: [
      { key: 'evolution_api_url', label: 'EVOLUTION_API_URL', atual: null, kind: 'secret-supabase', obrigatorio: true, comoObter: 'URL da sua instalação Evolution GO (Railway) do novo app.' },
      { key: 'evolution_api_key', label: 'EVOLUTION_API_KEY', atual: null, kind: 'secret-supabase', obrigatorio: true, comoObter: 'Chave global da Evolution API.', naoSubstituivel: true },
      { key: 'evolution_instance_name', label: 'EVOLUTION_INSTANCE_NAME', atual: 'horus-main (padrão do código)', kind: 'secret-supabase', obrigatorio: true, comoObter: 'Nome da instância nova no Evolution Manager. Depois de conectar o QR, reaplique o webhook para a função horus-webhook.' },
      { key: 'evolution_instance_id', label: 'EVOLUTION_INSTANCE_ID', atual: null, kind: 'secret-supabase', comoObter: 'Exibido no Evolution Manager após criar a instância.' },
      { key: 'evolution_instance_token', label: 'EVOLUTION_INSTANCE_TOKEN', atual: null, kind: 'secret-supabase', comoObter: 'Token/apikey da instância criada.', naoSubstituivel: true },
      { key: 'horus_webhook', label: 'Webhook do Horus', atual: '<SUPABASE_URL>/functions/v1/horus-webhook', kind: 'painel-externo', obrigatorio: true, comoObter: 'Configurar na instância com os eventos MESSAGES_UPSERT, CONNECTION_UPDATE, QRCODE_UPDATED e SEND_MESSAGE.' },
      { key: 'horus_app_url', label: 'HORUS_APP_URL', atual: null, kind: 'secret-supabase', comoObter: 'Link do app novo enviado pelo assistente no WhatsApp.' },
      { key: 'horus_play_url', label: 'HORUS_PLAY_STORE_URL', atual: null, kind: 'secret-supabase', comoObter: 'https://play.google.com/store/apps/details?id=<novo package>.' },
      { key: 'horus_internal_token', label: 'HORUS_INTERNAL_TOKEN', atual: null, kind: 'secret-supabase', comoObter: 'Token interno novo (gere um aleatório) para chamadas entre funções.', naoSubstituivel: true },
    ],
  },
  {
    id: 'marketing',
    titulo: 'Marketing e rastreamento',
    desc: 'Meta, pixel e conversões',
    itens: [
      { key: 'meta_app_id', label: 'Facebook App ID', atual: '1590734976033061', kind: 'arquivo', arquivos: ['src/lib/metaAppEvents.ts', 'public/workflows/build-android.yml', 'src/generated/workflows/build-android.yml', 'public/workflows/build-ios.yml', 'src/generated/workflows/build-ios.yml', 'android-config/FACEBOOK_SDK.md'], comoObter: 'developers.facebook.com → criar app novo → App ID.' },
      { key: 'meta_pixel_id', label: 'META_PIXEL_ID', atual: null, kind: 'secret-supabase', comoObter: 'Meta Events Manager → criar pixel do novo negócio.' },
      { key: 'meta_capi_token', label: 'META_CAPI_ACCESS_TOKEN', atual: null, kind: 'secret-supabase', comoObter: 'Events Manager → Conversions API → gerar token.', naoSubstituivel: true },
    ],
  },
  {
    id: 'servicos',
    titulo: 'Serviços e APIs de terceiros',
    desc: 'IA, e-mail, mapas e integrações',
    itens: [
      { key: 'gemini_api_key', label: 'GEMINI_API_KEY (+ _RESERVA)', atual: null, kind: 'secret-supabase', obrigatorio: true, comoObter: 'aistudio.google.com → API keys do projeto novo.', naoSubstituivel: true },
      { key: 'mistral_api_key', label: 'MISTRAL_API_KEY', atual: null, kind: 'secret-supabase', comoObter: 'console.mistral.ai (OCR dos livros).', naoSubstituivel: true },
      { key: 'resend_api_key', label: 'RESEND_API_KEY', atual: null, kind: 'secret-supabase', comoObter: 'resend.com — precisa verificar o domínio novo.', naoSubstituivel: true },
      { key: 'google_maps_key', label: 'GOOGLE_MAPS_API_KEY (backend e browser)', atual: '(chave browser no .env)', kind: 'secret-supabase', arquivos: ['.env'], comoObter: 'Google Cloud → Credenciais → chave de API, restrita ao domínio/package novo.', naoSubstituivel: true },
      { key: 'outras_apis', label: 'PERPLEXITY / FIRECRAWL / TINIFY / BROWSERLESS / TMDB / YOUTUBE_* / LANGFUSE_* / GCP_*', atual: null, kind: 'secret-supabase', comoObter: 'Recriar cada conta/chave no nome da nova marca (opcionais — só afetam as funções que as usam).', naoSubstituivel: true },
      { key: 'github_api_key', label: 'GITHUB_API_KEY', atual: null, kind: 'secret-supabase', comoObter: 'Token do repositório novo (dispara os builds pelo app).', naoSubstituivel: true },
    ],
  },
  {
    id: 'desktop',
    titulo: 'Desktop (Electron)',
    desc: 'Instalador Windows/macOS',
    itens: [
      { key: 'desktop_app_id', label: 'appId do Electron', atual: 'app.lovable.vademecum.desktop', kind: 'arquivo', arquivos: ['electron-builder.yml'], comoObter: 'Você escolhe (formato reverso de domínio).' },
      { key: 'desktop_product_name', label: 'productName / publisherName / artifactName', atual: 'Vade Mecum Comentado / Direito Prime', kind: 'arquivo', arquivos: ['electron-builder.yml'], comoObter: 'Nome exibido no instalador e nas propriedades do .exe.' },
      { key: 'desktop_cert', label: 'CSC_LINK + CSC_KEY_PASSWORD', atual: null, kind: 'secret-github', comoObter: 'Certificado de assinatura de código da nova empresa (opcional; sem ele o SmartScreen alerta).', naoSubstituivel: true },
    ],
  },
  {
    id: 'branding',
    titulo: 'Marca e assets',
    desc: 'Ícones, splash, cores e canais de push',
    itens: [
      { key: 'push_channels', label: 'IDs dos canais de push (Android)', atual: 'direitoprime-alertas-v2, oab-estudante, oab-concurseiro, oab-advogado', kind: 'arquivo', arquivos: ['src/lib/nativeNotificationChannels.ts'], comoObter: 'Renomeie os IDs para a nova marca (canais antigos ficariam órfãos no aparelho).' },
      { key: 'icones_splash', label: 'Ícones, splash e cores', atual: '#EF4444 (splash) / #1a0a14 (tema)', kind: 'arquivo', arquivos: ['capacitor.config.ts', 'public/site.webmanifest', 'index.html'], comoObter: 'Suba os assets novos em /admin-native-assets e ajuste as cores.' },
      { key: 'seo_meta', label: 'Título, descrição e Open Graph', atual: 'Direito Prime — Vade Mecum 2026', kind: 'arquivo', arquivos: ['index.html', 'public/site.webmanifest'], comoObter: 'Textos de marketing do app novo.' },
    ],
  },
];

export const TRANSFER_ITENS: TransferItem[] = TRANSFER_GROUPS.flatMap((g) => g.itens);

export const KIND_LABEL: Record<TransferKind, string> = {
  arquivo: 'Arquivo no código',
  'secret-github': 'Secret do GitHub',
  'secret-supabase': 'Secret do Supabase',
  'painel-externo': 'Painel externo',
};
