# Secrets Pendentes — Configurar Depois

Este arquivo lista as variáveis de ambiente (secrets) que ainda **não foram configuradas** no projeto Supabase conectado (`dnjrgpldcwcpoywamorr`).

> ✅ Secrets já configuradas: `GEMINI_API_KEY`, `GEMINI_API_KEY_RESERVA`, `MISTRAL_API_KEY`, `FIRECRAWL_API_KEY`, `GOOGLE_MAPS_API_KEY`, `GITHUB_API_KEY`, `BROWSERLESS_API_KEY`, `PERPLEXITY_API_KEY`, `RESEND_API_KEY`, `ASAAS_API_KEY`, `TINIFY_API_KEY`, `TMDB_API_KEY`, `EVOLUTION_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_INSTANCE_NAME`, `YOUTUBE_API_KEY`, `LOVABLE_API_KEY`.
>
> 🔧 Secrets automáticas do Supabase (não precisa configurar): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 1. Evolution (WhatsApp) — Opcionais

Essas não são obrigatórias. O código consegue descobrir o ID e token da instância pela API usando URL + API key + nome.

| Secret | Onde encontrar |
| --- | --- |
| `EVOLUTION_INSTANCE_ID` | Manager da instância `horus-main` → página da instância → campo **Instance ID** (UUID). |
| `EVOLUTION_INSTANCE_TOKEN` | Manager da instância `horus-main` → página da instância → campo **Token** (se houver). |

---

## 2. Google / YouTube — Upload de vídeos (Opcional)

Só necessário se quiser usar `boletim-youtube-upload` para postar vídeos automaticamente. Para **buscar** vídeos, apenas `YOUTUBE_API_KEY` (já configurada).

| Secret | Onde encontrar |
| --- | --- |
| `YOUTUBE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application). |
| `YOUTUBE_CLIENT_SECRET` | Mesma tela do Client ID → secret. |
| `YOUTUBE_REFRESH_TOKEN` | Gerado via OAuth flow do YouTube Data API v3, usando o Client ID/Secret e escopo `https://www.googleapis.com/auth/youtube.upload`. |

---

## 3. Google Play / Android

| Secret | Onde encontrar |
| --- | --- |
| `ANDROID_PACKAGE_NAME` | Google Play Console → App → nome do pacote (ex.: `com.horus.app`). |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play Console → API access → Service account → chave JSON (base64 ou string completa). |
| `GOOGLE_PLAY_PUBSUB_VERIFICATION_TOKEN` | Google Cloud Console → Pub/Sub → assinatura do tópico de billing → token de verificação. |

---

## 4. Apple / App Store Connect

| Secret | Onde encontrar |
| --- | --- |
| `APPLE_BUNDLE_ID` | Apple Developer → Identifiers → App ID (ex.: `com.horus.app`). |
| `APPLE_APP_STORE_CONNECT_ISSUER_ID` | App Store Connect → Users and Access → Keys → Issuer ID. |
| `APPLE_APP_STORE_CONNECT_KEY_ID` | App Store Connect → Users and Access → Keys → Key ID da chave de API. |
| `APPLE_APP_STORE_CONNECT_KEY_P8_BASE64` | Arquivo `.p8` da chave App Store Connect, codificado em base64. |

---

## 5. Meta (Facebook / Instagram Ads / CAPI)

| Secret | Onde encontrar |
| --- | --- |
| `META_PIXEL_ID` | Events Manager → pixel do site/app. |
| `META_CAPI_ACCESS_TOKEN` | Events Manager → Configurações do pixel → Conversions API → token de acesso. |
| `META_CAPI_TEST_CODE` | Events Manager → ferramenta de testes do CAPI → código de teste (opcional). |

---

## 6. Firebase Cloud Messaging (Push)

| Secret | Onde encontrar |
| --- | --- |
| `FCM_SERVICE_ACCOUNT_JSON` | Firebase Console → Project settings → Service accounts → Generate new private key → JSON base64. |

---

## 7. Google Cloud Platform (Billing / APIs)

| Secret | Onde encontrar |
| --- | --- |
| `GCP_PROJECT_ID` | Google Cloud Console → seletor de projeto → Project ID. |
| `GCP_BILLING_DATASET` | BigQuery → dataset com os dados de faturamento do Cloud (ex.: `billing_export`). |
| `GCP_BILLING_TABLE` | BigQuery → tabela dentro do dataset (ex.: `gcp_billing_export_v1_XXXXX`). |
| `GCP_SERVICE_ACCOUNT_JSON` | Google Cloud Console → IAM → Service Accounts → chave JSON base64. |

---

## 8. Langfuse (Observabilidade de LLM)

| Secret | Onde encontrar |
| --- | --- |
| `LANGFUSE_HOST` | URL do seu Langfuse (ex.: `https://langfuse.horus.app` ou `https://us.cloud.langfuse.com`). |
| `LANGFUSE_PUBLIC_KEY` | Langfuse → Project settings → API keys → Public key. |
| `LANGFUSE_SECRET_KEY` | Langfuse → Project settings → API keys → Secret key. |

---

## 9. URLs e tokens internos do app

| Secret | Onde encontrar |
| --- | --- |
| `PUBLIC_SITE_URL` | URL pública do app (ex.: `https://app.horus.com.br`). |
| `HORUS_APP_URL` | Mesma coisa ou URL específica do app Horus. |
| `HORUS_PLAY_STORE_URL` | Link do app na Google Play Store. |
| `HORUS_INTERNAL_TOKEN` | Token interno para comunicação segura entre edge functions (gerar um valor aleatório forte). |

---

## 10. Admin / Utilitários

| Secret | Onde encontrar |
| --- | --- |
| `ADMIN_DOWNLOAD_EMAILS` | Lista de e-mails autorizados a baixar dados administrativos (separados por vírgula). |
| `ADMIN_DOWNLOAD_PASSWORD` | Senha de acesso à rota admin de download. |
| `GEMINI_MODEL` | Modelo do Gemini a ser usado (ex.: `gemini-1.5-pro-latest`). Se não configurar, o código usa fallback. |

---

## Como configurar

1. Peça para o agente Lovable: *"Configure os secrets do grupo X"*.
2. O agente abrirá um formulário seguro para você colar cada valor.
3. Nunca cole valores de API key diretamente no chat — use sempre o formulário seguro.

> 💡 Dica: configure primeiro os grupos que o app realmente usa. Os grupos 2, 3, 4 e 6 só são necessários se você for usar upload no YouTube, Google Play, App Store ou push notifications.
