# Task — Desempenho Perceptível

## Checklist

### 1. Reduzir fontes bloqueantes no boot
- [x] Mover fontes não-essenciais do main.tsx para carregamento assíncrono
- [x] Manter apenas Barlow 400/600/700 + Bebas Neue 400 síncrono
- [x] Carregar Literata, JetBrains Mono, pesos extras via requestIdleCallback

### 2. Reduzir delay do warmup de 3.5s → 1s no nativo
- [x] Detectar Capacitor.isNativePlatform() no appWarmupService
- [x] Reduzir setTimeout de 3500ms para 1000ms no nativo
- [x] Priorizar Vade Mecum antes de Biblioteca

### 3. Pré-carregar 8 leis mais acessadas na RAM
- [x] Criar cache síncrono em memória para CF, CP, CC, CPC, CPP, CLT, CTN, CDC
- [x] Popular durante primeMemoryCacheFromBundle com prioridade
- [x] Servir do Map estático antes de consultar IndexedDB

### Validação
- [x] tsc --noEmit sem erros
- [x] Build Vite sem erros
- [x] Git commit + push
