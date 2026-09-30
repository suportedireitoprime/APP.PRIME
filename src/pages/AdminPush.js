"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminPush;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var react_router_dom_1 = require("react-router-dom");
var client_1 = require("@/integrations/supabase/client");
var card_1 = require("@/components/ui/card");
var badge_1 = require("@/components/ui/badge");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var textarea_1 = require("@/components/ui/textarea");
var switch_1 = require("@/components/ui/switch");
var dialog_1 = require("@/components/ui/dialog");
var lucide_react_1 = require("lucide-react");
var sonner_1 = require("sonner");
var SLOTS_2H30 = [
    {
        id: "slot-1",
        hora: 7,
        minuto: 0,
        labelHora: "07:00",
        automation_key: "boletim_leis_matinal",
        nome: "Radar de Leis & DOU",
        emoji: "📜",
        funcaoEdge: "radar-leis-notify",
        deepLink: "/radar-360",
        descricao: "Varredura do Diário Oficial da União e atos normativos das últimas 24h.",
        tituloPadrao: "📜 Novas leis publicadas no Diário Oficial hoje!",
        corpoPadrao: "⚖️ Atos normativos de alto impacto acabam de entrar em vigor. Toque para ler.",
        capaPadrao: "/assets/push/capa-radar-leis.webp",
    },
    {
        id: "slot-2",
        hora: 9,
        minuto: 30,
        labelHora: "09:30",
        automation_key: "boletim_juridico_diario",
        nome: "Boletim Jurídico & Tribunais",
        emoji: "📰",
        funcaoEdge: "notif-noticias-dia",
        deepLink: "/noticias",
        descricao: "Giro matinal das principais notícias e pautas do STF e STJ (+2h30 do anterior).",
        tituloPadrao: "📰 Boletim do Dia: O que você precisa saber hoje",
        corpoPadrao: "☕ Leitura rápida para não ficar desatualizado na prática forense.",
        capaPadrao: "/assets/push/capa-noticias-juridicas.webp",
    },
    {
        id: "slot-3",
        hora: 12,
        minuto: 0,
        labelHora: "12:00",
        automation_key: "push-aleatorio-blog",
        nome: "Artigo Doutrinário & Blog",
        emoji: "✍️",
        funcaoEdge: "push-aleatorio-blog",
        deepLink: "/blog",
        descricao: "Artigo doutrinário selecionado para leitura na pausa do almoço (+2h30 do anterior).",
        tituloPadrao: "✍️ Leitura de Meio-Dia: Recomendação Especial para você",
        corpoPadrao: "Aprofunde-se neste artigo selecionado para sua pausa de descanso.",
        capaPadrao: "/assets/push/capa-estudo-horus.webp",
    },
    {
        id: "slot-4",
        hora: 14,
        minuto: 30,
        labelHora: "14:30",
        automation_key: "push-aleatorio-audio",
        nome: "Audioaula Estratégica",
        emoji: "🎧",
        funcaoEdge: "push-aleatorio-audio",
        deepLink: "/aprender",
        descricao: "Revisão passiva no fone de ouvido para foco à tarde (+2h30 do anterior).",
        tituloPadrao: "🎧 Coloque o fone de ouvido: Audioaula surpresa para sua tarde",
        corpoPadrao: "Aproveite para revisar um conteúdo importante enquanto faz outras tarefas.",
        capaPadrao: "/assets/push/capa-estudo-horus.webp",
    },
    {
        id: "slot-5",
        hora: 17,
        minuto: 0,
        labelHora: "17:00",
        automation_key: "push-aleatorio-video",
        nome: "Videoaula do Dia",
        emoji: "📺",
        funcaoEdge: "push-aleatorio-video",
        deepLink: "/aprender",
        descricao: "Videoaula recomendada para o estudo ativo de fim de tarde (+2h30 do anterior).",
        tituloPadrao: "📺 Fim de Tarde de Foco: Sua videoaula recomendada de hoje",
        corpoPadrao: "Assista agora a esta aula estratégica e garanta mais uma etapa vencida no dia.",
        capaPadrao: "/assets/push/capa-estudo-horus.webp",
    },
    {
        id: "slot-6",
        hora: 19,
        minuto: 30,
        labelHora: "19:30",
        automation_key: "push-simulado-desafio",
        nome: "Fixação & Questão do Dia",
        emoji: "🎯",
        funcaoEdge: "send-push",
        deepLink: "/simulados",
        descricao: "Desafio prático com questão comentada de concurso e OAB (+2h30 do anterior).",
        tituloPadrao: "🎯 Desafio Noturno: Teste seus conhecimentos agora!",
        corpoPadrao: "Uma questão comentada selecionada para testar seu raciocínio jurídico hoje.",
        capaPadrao: "/assets/push/capa-estudo-horus.webp",
    },
    {
        id: "slot-7",
        hora: 22,
        minuto: 0,
        labelHora: "22:00",
        automation_key: "boletim_noticias_diario",
        nome: "Síntese Noturna dos Tribunais",
        emoji: "🌙",
        funcaoEdge: "notif-noticias-dia",
        deepLink: "/noticias",
        descricao: "Giro final de fechamento do dia nos tribunais (+2h30 do anterior).",
        tituloPadrao: "🌙 Fechamento: O resumo das notícias mais quentes de hoje",
        corpoPadrao: "Confira as decisões de destaque antes de finalizar o expediente.",
        capaPadrao: "/assets/push/capa-noticias-juridicas.webp",
    },
];
function AdminPush() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    // Estados principais
    var _a = (0, react_1.useState)(new Date()), dataFiltro = _a[0], setDataFiltro = _a[1];
    var _b = (0, react_1.useState)(false), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)("cronograma"), activeTab = _c[0], setActiveTab = _c[1];
    var _d = (0, react_1.useState)("todos"), filtroStatus = _d[0], setFiltroStatus = _d[1];
    // Dados do Supabase
    var _e = (0, react_1.useState)([]), campaigns = _e[0], setCampaigns = _e[1];
    var _f = (0, react_1.useState)({}), automacoes = _f[0], setAutomacoes = _f[1];
    var _g = (0, react_1.useState)({ total: 0, android: 0, ios: 0, web: 0 }), tokenStats = _g[0], setTokenStats = _g[1];
    var _h = (0, react_1.useState)([]), pushEvents = _h[0], setPushEvents = _h[1];
    // Estados de ação e modais
    var _j = (0, react_1.useState)(null), testandoKey = _j[0], setTestandoKey = _j[1];
    var _k = (0, react_1.useState)(null), disparandoKey = _k[0], setDisparandoKey = _k[1];
    var _l = (0, react_1.useState)(null), previewSlot = _l[0], setPreviewSlot = _l[1];
    var _m = (0, react_1.useState)("android"), previewOs = _m[0], setPreviewOs = _m[1];
    var _o = (0, react_1.useState)(null), expandidoId = _o[0], setExpandidoId = _o[1];
    // Modal Novo Disparo Manual
    var _p = (0, react_1.useState)(false), modalNovoPush = _p[0], setModalNovoPush = _p[1];
    var _q = (0, react_1.useState)(""), novoTitulo = _q[0], setNovoTitulo = _q[1];
    var _r = (0, react_1.useState)(""), novoCorpo = _r[0], setNovoCorpo = _r[1];
    var _s = (0, react_1.useState)("/radar-360"), novoUrl = _s[0], setNovoUrl = _s[1];
    var _t = (0, react_1.useState)("all"), novoPublico = _t[0], setNovoPublico = _t[1];
    var _u = (0, react_1.useState)("/assets/push/capa-noticias-juridicas.webp"), novoImagem = _u[0], setNovoImagem = _u[1];
    var _v = (0, react_1.useState)(false), enviandoManual = _v[0], setEnviandoManual = _v[1];
    // Carregar dados
    function carregarDados() {
        return __awaiter(this, void 0, void 0, function () {
            var inicio, fim, _a, campsRes, autsRes, tokensRes, eventsRes, autsMap_1, tStats_1, e_1;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        setLoading(true);
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, 4, 5]);
                        inicio = new Date(dataFiltro);
                        inicio.setHours(0, 0, 0, 0);
                        fim = new Date(dataFiltro);
                        fim.setHours(23, 59, 59, 999);
                        return [4 /*yield*/, Promise.all([
                                client_1.supabase
                                    .from("push_campaigns")
                                    .select("id,title,body,status,automation_key,scheduled_at,next_run_at,created_at,sent_count,failed_count,opened_count,delivered_count,image_url")
                                    .or("and(created_at.gte.".concat(inicio.toISOString(), ",created_at.lte.").concat(fim.toISOString(), "),and(next_run_at.gte.").concat(inicio.toISOString(), ",next_run_at.lte.").concat(fim.toISOString(), ")"))
                                    .order("created_at", { ascending: false }),
                                client_1.supabase.from("push_automations").select("*"),
                                client_1.supabase.from("device_tokens").select("platform"),
                                client_1.supabase
                                    .from("push_events")
                                    .select("event_type")
                                    .gte("created_at", inicio.toISOString())
                                    .lte("created_at", fim.toISOString()),
                            ])];
                    case 2:
                        _a = _f.sent(), campsRes = _a[0], autsRes = _a[1], tokensRes = _a[2], eventsRes = _a[3];
                        setCampaigns(((_b = campsRes.data) !== null && _b !== void 0 ? _b : []));
                        autsMap_1 = {};
                        ((_c = autsRes.data) !== null && _c !== void 0 ? _c : []).forEach(function (a) {
                            autsMap_1[a.key] = a;
                        });
                        setAutomacoes(autsMap_1);
                        tStats_1 = { total: 0, android: 0, ios: 0, web: 0 };
                        ((_d = tokensRes.data) !== null && _d !== void 0 ? _d : []).forEach(function (row) {
                            tStats_1.total++;
                            if (row.platform === "android")
                                tStats_1.android++;
                            else if (row.platform === "ios")
                                tStats_1.ios++;
                            else if (row.platform === "web")
                                tStats_1.web++;
                        });
                        setTokenStats(tStats_1);
                        setPushEvents((_e = eventsRes.data) !== null && _e !== void 0 ? _e : []);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _f.sent();
                        console.error("Erro ao carregar dados de push:", e_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    (0, react_1.useEffect)(function () {
        carregarDados();
    }, [dataFiltro]);
    // Seletor de dias (Hoje na extrema esquerda, depois D-1, D-2...)
    var listaDias = (0, react_1.useMemo)(function () {
        var arr = [];
        for (var i = 0; i < 10; i++) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            arr.push(d);
        }
        return arr;
    }, []);
    var isHoje = dataFiltro.toDateString() === new Date().toDateString();
    var agoraMinutos = isHoje ? new Date().getHours() * 60 + new Date().getMinutes() : 9999;
    // Métricas agregadas do dia
    var metricas = (0, react_1.useMemo)(function () {
        var totalEnviados = 0;
        var totalFalhas = 0;
        var totalAbertos = 0;
        campaigns.forEach(function (c) {
            var _a, _b, _c;
            totalEnviados += (_a = c.sent_count) !== null && _a !== void 0 ? _a : 0;
            totalFalhas += (_b = c.failed_count) !== null && _b !== void 0 ? _b : 0;
            totalAbertos += (_c = c.opened_count) !== null && _c !== void 0 ? _c : 0;
        });
        var taxaEntrega = totalEnviados > 0 ? Math.round(((totalEnviados - totalFalhas) / totalEnviados) * 100) : 100;
        var taxaAbertura = totalEnviados > 0 ? Math.round((totalAbertos / totalEnviados) * 100) : 0;
        return {
            totalEnviados: totalEnviados,
            totalFalhas: totalFalhas,
            totalAbertos: totalAbertos,
            taxaEntrega: taxaEntrega,
            taxaAbertura: taxaAbertura,
        };
    }, [campaigns]);
    // Processamento dos 7 slots diários
    var slotsProcessados = (0, react_1.useMemo)(function () {
        return SLOTS_2H30.map(function (slot) {
            var slotMinutos = slot.hora * 60 + slot.minuto;
            var campanhaEncontrada = campaigns.find(function (c) { return c.automation_key === slot.automation_key; });
            var automacaoDb = automacoes[slot.automation_key];
            var isAtivo = automacaoDb ? automacaoDb.enabled : true;
            var status = "previsto";
            var statusLabel = "Previsto";
            if (campanhaEncontrada) {
                if (campanhaEncontrada.status === "failed" || (campanhaEncontrada.sent_count === 0 && campanhaEncontrada.failed_count > 0)) {
                    status = "falha";
                    statusLabel = "Falha no disparo";
                }
                else {
                    status = "enviado";
                    statusLabel = "".concat(campanhaEncontrada.sent_count, " enviados");
                }
            }
            else if (isHoje) {
                if (slotMinutos < agoraMinutos) {
                    status = "previsto";
                    statusLabel = "Horário concluído";
                }
                else if (slotMinutos >= agoraMinutos && slotMinutos <= agoraMinutos + 150) {
                    status = "proximo";
                    statusLabel = "Próximo envio";
                }
                else {
                    status = "previsto";
                    statusLabel = "Agendado";
                }
            }
            return __assign(__assign({}, slot), { slotMinutos: slotMinutos, campanha: campanhaEncontrada, isAtivo: isAtivo, status: status, statusLabel: statusLabel });
        });
    }, [campaigns, automacoes, isHoje, agoraMinutos]);
    // Filtro de slots
    var slotsFiltrados = (0, react_1.useMemo)(function () {
        if (filtroStatus === "todos")
            return slotsProcessados;
        if (filtroStatus === "enviados")
            return slotsProcessados.filter(function (s) { return s.status === "enviado"; });
        if (filtroStatus === "erros")
            return slotsProcessados.filter(function (s) { return s.status === "falha"; });
        if (filtroStatus === "previstos")
            return slotsProcessados.filter(function (s) { return s.status === "previsto" || s.status === "proximo"; });
        return slotsProcessados;
    }, [slotsProcessados, filtroStatus]);
    // 1. Testar Admin (Push + WhatsApp)
    function testarAdmin(slot) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, error, pushOk, wppOk, e_2;
            var _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        setTestandoKey(slot.automation_key);
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, client_1.supabase.functions.invoke("push-testar-admin", {
                                body: {
                                    automation_key: slot.automation_key,
                                    title: slot.tituloPadrao,
                                    body: slot.corpoPadrao,
                                    url: slot.deepLink,
                                    image: slot.capaPadrao,
                                },
                            })];
                    case 2:
                        _a = _g.sent(), data = _a.data, error = _a.error;
                        if (error)
                            throw error;
                        pushOk = !((_c = (_b = data === null || data === void 0 ? void 0 : data.results) === null || _b === void 0 ? void 0 : _b.push) === null || _c === void 0 ? void 0 : _c.error);
                        wppOk = !((_e = (_d = data === null || data === void 0 ? void 0 : data.results) === null || _d === void 0 ? void 0 : _d.whatsapp) === null || _e === void 0 ? void 0 : _e.error);
                        sonner_1.toast.success("Teste enviado para os admins! (".concat(pushOk ? "Push OK" : "Push Falhou", " \u2022 ").concat(wppOk ? "WhatsApp OK" : "WhatsApp Falhou", ")"));
                        return [3 /*break*/, 5];
                    case 3:
                        e_2 = _g.sent();
                        sonner_1.toast.error((_f = e_2 === null || e_2 === void 0 ? void 0 : e_2.message) !== null && _f !== void 0 ? _f : "Falha ao enviar teste aos administradores");
                        return [3 /*break*/, 5];
                    case 4:
                        setTestandoKey(null);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    // 2. Disparar Agora (Execução Real da Edge Function para toda a base)
    function dispararBaseAgora(slot) {
        return __awaiter(this, void 0, void 0, function () {
            var confirmou, error, error, e_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        confirmou = window.confirm("Confirma o disparo REAL da rotina \"".concat(slot.nome, "\" para TODOS os usu\u00E1rios ativos cadastrados?"));
                        if (!confirmou)
                            return [2 /*return*/];
                        setDisparandoKey(slot.automation_key);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 9]);
                        if (!(slot.funcaoEdge === "send-push")) return [3 /*break*/, 3];
                        return [4 /*yield*/, client_1.supabase.functions.invoke("send-push", {
                                body: {
                                    title: slot.tituloPadrao,
                                    body: slot.corpoPadrao,
                                    url: slot.deepLink,
                                    audience: { all: true },
                                },
                            })];
                    case 2:
                        error = (_b.sent()).error;
                        if (error)
                            throw error;
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, client_1.supabase.functions.invoke(slot.funcaoEdge, {
                            body: { force: true },
                        })];
                    case 4:
                        error = (_b.sent()).error;
                        if (error)
                            throw error;
                        _b.label = 5;
                    case 5:
                        sonner_1.toast.success("Rotina \"".concat(slot.nome, "\" executada com sucesso! Atualizando m\u00E9tricas..."));
                        return [4 /*yield*/, carregarDados()];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        e_3 = _b.sent();
                        sonner_1.toast.error("Erro ao executar rotina: ".concat((_a = e_3 === null || e_3 === void 0 ? void 0 : e_3.message) !== null && _a !== void 0 ? _a : "Falha na comunicação com o servidor"));
                        return [3 /*break*/, 9];
                    case 8:
                        setDisparandoKey(null);
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    // 3. Toggle Ativar/Desativar Automação
    function alternarAutomacao(key, enabledAtual) {
        return __awaiter(this, void 0, void 0, function () {
            var novaEnabled, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        novaEnabled = !enabledAtual;
                        return [4 /*yield*/, client_1.supabase
                                .from("push_automations")
                                .update({ enabled: novaEnabled })
                                .eq("key", key)];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            sonner_1.toast.error("Erro ao salvar status da automação");
                            return [2 /*return*/];
                        }
                        setAutomacoes(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a[key] = __assign(__assign({}, prev[key]), { enabled: novaEnabled }), _a)));
                        });
                        sonner_1.toast.success(novaEnabled ? "Automação ativada" : "Automação pausada");
                        return [2 /*return*/];
                }
            });
        });
    }
    // 4. Envio Manual Rápido
    function enviarPushManual() {
        return __awaiter(this, void 0, void 0, function () {
            var error, e_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!novoTitulo.trim() || !novoCorpo.trim()) {
                            sonner_1.toast.error("Preencha o título e a mensagem");
                            return [2 /*return*/];
                        }
                        setEnviandoManual(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, client_1.supabase.functions.invoke("send-push", {
                                body: {
                                    title: novoTitulo,
                                    body: novoCorpo,
                                    url: novoUrl,
                                    audience: novoPublico === "all" ? { all: true } : { plan: novoPublico },
                                    imageUrl: novoImagem,
                                },
                            })];
                    case 2:
                        error = (_b.sent()).error;
                        if (error)
                            throw error;
                        sonner_1.toast.success("Notificação push disparada com sucesso para a base!");
                        setModalNovoPush(false);
                        setNovoTitulo("");
                        setNovoCorpo("");
                        return [4 /*yield*/, carregarDados()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        e_4 = _b.sent();
                        sonner_1.toast.error("Falha no envio: ".concat((_a = e_4 === null || e_4 === void 0 ? void 0 : e_4.message) !== null && _a !== void 0 ? _a : "Erro desconhecido"));
                        return [3 /*break*/, 6];
                    case 5:
                        setEnviandoManual(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-dvh bg-[#09090b] text-zinc-100 pb-16 selection:bg-emerald-500/30 selection:text-emerald-200", children: [(0, jsx_runtime_1.jsx)("header", { className: "sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 py-3 sm:px-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("button", { onClick: function () { return navigate("/admin-funcoes"); }, className: "w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95", title: "Voltar ao menu administrativo", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "w-5 h-5", strokeWidth: 2.4 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5", children: "Notifica\u00E7\u00F5es Push" }), (0, jsx_runtime_1.jsxs)("span", { className: "hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }), "Cad\u00EAncia 2h30m"] })] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-zinc-400", children: [isHoje ? "Cronograma ao vivo de hoje" : "Disparos de ".concat(dataFiltro.toLocaleDateString("pt-BR")), " \u00B7 ", tokenStats.total, " dispositivos ativos"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", onClick: function () { return setModalNovoPush(true); }, className: "h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 gap-1.5 active:scale-95", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "w-4 h-4", strokeWidth: 2.4 }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Novo Disparo" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: carregarDados, disabled: loading, className: "w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50", title: "Atualizar dados", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "w-4 h-4 ".concat(loading ? "animate-spin text-emerald-400" : "") }) })] })] }) }), (0, jsx_runtime_1.jsxs)("main", { className: "max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6", children: [(0, jsx_runtime_1.jsxs)("section", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-3.5 bg-zinc-900/50 border-zinc-800/80 rounded-2xl flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: "w-3.5 h-3.5 text-zinc-400" }), " Enviadas Hoje"] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-black text-white tracking-tight", children: metricas.totalEnviados }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-emerald-400 mt-0.5 font-medium flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-3 h-3" }), " ", metricas.taxaEntrega, "% taxa de entrega"] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-3.5 bg-zinc-900/50 border-zinc-800/80 rounded-2xl flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "w-3.5 h-3.5 text-emerald-400" }), " Aberturas"] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-black text-emerald-400 tracking-tight", children: metricas.totalAbertos }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-zinc-400 mt-0.5", children: [metricas.taxaAbertura, "% taxa de abertura"] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-3.5 bg-zinc-900/50 border-zinc-800/80 rounded-2xl flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[11px] font-medium text-sky-400 uppercase tracking-wider flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Smartphone, { className: "w-3.5 h-3.5 text-sky-400" }), " Dispositivos FCM"] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-black text-white tracking-tight", children: tokenStats.total }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] text-zinc-400 mt-0.5 truncate", children: [tokenStats.android, " Android \u00B7 ", tokenStats.ios, " iOS \u00B7 ", tokenStats.web, " Web"] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-3.5 bg-zinc-900/50 border-zinc-800/80 rounded-2xl flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-3.5 h-3.5 text-zinc-400" }), " Falhas / Erros"] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-black tracking-tight ".concat(metricas.totalFalhas > 0 ? "text-red-400" : "text-white"), children: metricas.totalFalhas }), (0, jsx_runtime_1.jsx)("div", { className: "text-[11px] text-zinc-400 mt-0.5", children: metricas.totalFalhas === 0 ? "Nenhum erro registrado" : "Verificar logs de envio" })] })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-2 text-xs font-semibold text-zinc-400 flex items-center gap-1.5 shrink-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { className: "w-3.5 h-3.5 text-zinc-400" }), " Data:"] }), listaDias.map(function (d, idx) {
                                var ehHoje = d.toDateString() === new Date().toDateString();
                                var selecionado = d.toDateString() === dataFiltro.toDateString();
                                var diaSemana = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
                                var diaNum = d.getDate();
                                return ((0, jsx_runtime_1.jsxs)("button", { onClick: function () { return setDataFiltro(d); }, className: "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ".concat(selecionado
                                        ? "bg-zinc-100 text-zinc-950 font-bold shadow"
                                        : ehHoje
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                                            : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"), children: [ehHoje && (0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400" }), (0, jsx_runtime_1.jsx)("span", { children: ehHoje ? "Hoje" : diaSemana }), (0, jsx_runtime_1.jsxs)("span", { className: "opacity-80 font-mono", children: ["(", diaNum, ")"] })] }, idx));
                            })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-3 border-b border-zinc-800 pb-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800", children: [(0, jsx_runtime_1.jsx)("button", { onClick: function () { return setActiveTab("cronograma"); }, className: "px-3 py-1.5 text-xs font-medium rounded-lg transition-all ".concat(activeTab === "cronograma"
                                            ? "bg-zinc-800 text-white shadow-sm font-semibold"
                                            : "text-zinc-400 hover:text-zinc-200"), children: "Cronograma (2h30m)" }), (0, jsx_runtime_1.jsx)("button", { onClick: function () { return setActiveTab("automacoes"); }, className: "px-3 py-1.5 text-xs font-medium rounded-lg transition-all ".concat(activeTab === "automacoes"
                                            ? "bg-zinc-800 text-white shadow-sm font-semibold"
                                            : "text-zinc-400 hover:text-zinc-200"), children: "Regras & Fun\u00E7\u00F5es" }), (0, jsx_runtime_1.jsxs)("button", { onClick: function () { return setActiveTab("historico"); }, className: "px-3 py-1.5 text-xs font-medium rounded-lg transition-all ".concat(activeTab === "historico"
                                            ? "bg-zinc-800 text-white shadow-sm font-semibold"
                                            : "text-zinc-400 hover:text-zinc-200"), children: ["Hist\u00F3rico (", campaigns.length, ")"] })] }), activeTab === "cronograma" && ((0, jsx_runtime_1.jsxs)("div", { className: "hidden sm:flex items-center gap-1 text-[11px] text-zinc-400", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-500 font-mono", children: "Filtrar:" }), ["todos", "enviados", "previstos", "erros"].map(function (st) { return ((0, jsx_runtime_1.jsx)("button", { onClick: function () { return setFiltroStatus(st); }, className: "px-2 py-0.5 rounded capitalize transition-all ".concat(filtroStatus === st ? "bg-zinc-800 text-white font-semibold" : "hover:text-zinc-200"), children: st }, st)); })] }))] }), activeTab === "cronograma" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-xs text-zinc-400 px-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "w-3.5 h-3.5 text-emerald-400" }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "7 hor\u00E1rios sequenciais" }), " com espa\u00E7amento exato de ", (0, jsx_runtime_1.jsx)("strong", { children: "2h30m" })] })] }), (0, jsx_runtime_1.jsx)("span", { className: "font-mono text-zinc-500", children: "07:00 \u2192 09:30 \u2192 12:00 \u2192 14:30 \u2192 17:00 \u2192 19:30 \u2192 22:00" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: slotsFiltrados.map(function (slot, index) {
                                    var isSent = slot.status === "enviado";
                                    var isFailed = slot.status === "falha";
                                    var isNext = slot.status === "proximo";
                                    var isExpanded = expandidoId === slot.id;
                                    return ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [index > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center py-1", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 px-3 py-0.5 rounded-full bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400 font-mono", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "w-2.5 h-2.5 text-zinc-400" }), (0, jsx_runtime_1.jsx)("span", { children: "+ 2 horas e 30 minutos" })] }) })), (0, jsx_runtime_1.jsx)(card_1.Card, { className: "relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 ".concat(isSent
                                                    ? "bg-zinc-900/40 border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.03)]"
                                                    : isFailed
                                                        ? "bg-zinc-900/40 border-red-500/40 hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.06)]"
                                                        : isNext
                                                            ? "bg-zinc-900/80 border-emerald-500/50 ring-1 ring-emerald-500/30"
                                                            : "bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700"), children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-start justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0 space-y-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-wrap", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-white border border-zinc-700", children: slot.labelHora }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm font-bold text-white flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { children: slot.emoji }), " ", slot.nome] }), isSent && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { className: "bg-emerald-500 text-zinc-950 font-black text-[10px] gap-1 hover:bg-emerald-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "w-3 h-3" }), " ENVIADO"] })), isFailed && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { className: "bg-red-500 text-white font-black text-[10px] gap-1 animate-pulse", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { className: "w-3 h-3" }), " FALHA"] })), isNext && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { className: "bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] gap-1 font-semibold animate-pulse", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "w-3 h-3" }), " PR\u00D3XIMO DISPARO"] })), !isSent && !isFailed && !isNext && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "text-[10px] text-zinc-400 border-zinc-700 bg-zinc-800/40", children: "AGENDADO" })), !slot.isAtivo && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "text-[10px] text-zinc-500 border-zinc-800", children: "Pausado" }))] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-400 leading-relaxed", children: slot.campanha ? slot.campanha.body : slot.descricao }), slot.campanha && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-xs text-zinc-400 pt-1 font-mono", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-emerald-400 font-semibold", children: ["\u2713 ", slot.campanha.sent_count, " disparos entregues"] }), (0, jsx_runtime_1.jsx)("span", { children: "\u00B7" }), (0, jsx_runtime_1.jsxs)("span", { children: [slot.campanha.opened_count, " aberturas"] }), slot.campanha.failed_count > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\u00B7" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-red-400 font-semibold", children: [slot.campanha.failed_count, " falhas"] })] }))] })), isExpanded && ((0, jsx_runtime_1.jsx)("div", { className: "pt-2 text-xs text-zinc-400 space-y-1.5 border-t border-zinc-800/60 mt-2 animate-in fade-in", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-500 block text-[10px] uppercase font-mono", children: "Gatilho Edge:" }), (0, jsx_runtime_1.jsx)("code", { className: "text-emerald-400 font-mono text-[11px]", children: slot.funcaoEdge })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-500 block text-[10px] uppercase font-mono", children: "Deep Link Destino:" }), (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-300 font-mono text-[11px]", children: slot.deepLink })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sm:col-span-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-500 block text-[10px] uppercase font-mono", children: "T\u00EDtulo Padr\u00E3o:" }), (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-300", children: slot.tituloPadrao })] })] }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 shrink-0 self-end sm:self-center", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", variant: "outline", onClick: function () { return testarAdmin(slot); }, disabled: testandoKey === slot.automation_key, className: "h-8 text-xs px-2.5 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1 active:scale-95", title: "Disparar push e WhatsApp de teste apenas para os administradores", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FlaskConical, { className: "w-3.5 h-3.5 text-emerald-400" }), (0, jsx_runtime_1.jsx)("span", { children: testandoKey === slot.automation_key ? "Testando..." : "Testar Admin" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", variant: "outline", onClick: function () { return dispararBaseAgora(slot); }, disabled: disparandoKey === slot.automation_key, className: "h-8 text-xs px-2.5 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1 active:scale-95", title: "Executar imediatamente esta rotina para todos os usu\u00E1rios", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Play, { className: "w-3.5 h-3.5 text-sky-400" }), (0, jsx_runtime_1.jsx)("span", { children: disparandoKey === slot.automation_key ? "Disparando..." : "Disparar Base" })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: function () { return setPreviewSlot(slot); }, className: "h-8 w-8 p-0 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800", title: "Ver como fica no celular", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "w-3.5 h-3.5" }) }), (0, jsx_runtime_1.jsx)("div", { className: "pl-1 border-l border-zinc-800", title: "Ativar ou pausar slot", children: (0, jsx_runtime_1.jsx)(switch_1.Switch, { checked: slot.isAtivo, onCheckedChange: function () { return alternarAutomacao(slot.automation_key, slot.isAtivo); } }) }), (0, jsx_runtime_1.jsx)("button", { onClick: function () { return setExpandidoId(isExpanded ? null : slot.id); }, className: "h-8 w-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800", title: "Expandir informa\u00E7\u00F5es", children: isExpanded ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronUp, { className: "w-4 h-4" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "w-4 h-4" }) })] })] }) })] }, slot.id));
                                }) })] })), activeTab === "automacoes" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-zinc-400", children: ["Gerencie o status direto das rotinas registradas na tabela ", (0, jsx_runtime_1.jsx)("code", { className: "text-zinc-300", children: "push_automations" }), "."] }), Object.values(automacoes).map(function (auto) { return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-3.5 bg-zinc-900/40 border-zinc-800 rounded-2xl flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 min-w-0", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl", children: auto.emoji || "🔔" }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "font-semibold text-sm text-white flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: auto.nome }), (0, jsx_runtime_1.jsxs)("code", { className: "text-[10px] text-zinc-500 font-mono", children: ["(", auto.key, ")"] })] }), auto.descricao && (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-zinc-400 truncate", children: auto.descricao }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-zinc-500 mt-0.5", children: ["Destino: ", (0, jsx_runtime_1.jsx)("span", { className: "font-mono text-zinc-400", children: auto.default_url || "/" }), " \u00B7 Cooldown: ", auto.cooldown_minutos || 120, "m"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 shrink-0", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold ".concat(auto.enabled ? "text-emerald-400" : "text-zinc-500"), children: auto.enabled ? "Ativa" : "Pausada" }), (0, jsx_runtime_1.jsx)(switch_1.Switch, { checked: auto.enabled, onCheckedChange: function () { return alternarAutomacao(auto.key, auto.enabled); } })] })] }, auto.id)); })] })), activeTab === "historico" && ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: campaigns.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-12 text-zinc-500 text-sm", children: "Nenhum disparo registrado nesta data." })) : (campaigns.map(function (camp) { return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-3 bg-zinc-900/40 border-zinc-800 rounded-xl flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "min-w-0 flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-bold text-sm text-white truncate", children: camp.title }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", className: "text-[9px] font-mono text-zinc-400", children: camp.status })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-zinc-400 truncate mt-0.5", children: camp.body }), (0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] text-zinc-500 mt-1 font-mono", children: [new Date(camp.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), " \u00B7", " ", camp.sent_count, " enviados \u00B7 ", camp.opened_count, " abertos \u00B7 ", camp.failed_count, " falhas"] })] }), camp.image_url && ((0, jsx_runtime_1.jsx)("img", { src: camp.image_url, alt: "", className: "w-10 h-10 object-cover rounded-lg shrink-0 border border-zinc-800" }))] }, camp.id)); })) }))] }), (0, jsx_runtime_1.jsx)(dialog_1.Dialog, { open: !!previewSlot, onOpenChange: function (open) { return !open && setPreviewSlot(null); }, children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { className: "max-w-md bg-zinc-950 border-zinc-800 text-white rounded-3xl p-5", children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogHeader, { children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogTitle, { className: "text-base font-bold flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Pr\u00E9via no Smartphone" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs", children: [(0, jsx_runtime_1.jsx)("button", { onClick: function () { return setPreviewOs("android"); }, className: "px-2 py-0.5 rounded font-medium ".concat(previewOs === "android" ? "bg-zinc-800 text-white" : "text-zinc-500"), children: "Android" }), (0, jsx_runtime_1.jsx)("button", { onClick: function () { return setPreviewOs("ios"); }, className: "px-2 py-0.5 rounded font-medium ".concat(previewOs === "ios" ? "bg-zinc-800 text-white" : "text-zinc-500"), children: "iOS" })] })] }) }), previewSlot && ((0, jsx_runtime_1.jsxs)("div", { className: "py-2 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mx-auto w-[280px] sm:w-[320px] rounded-[32px] border-4 border-zinc-800 bg-zinc-950 p-4 shadow-2xl relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-20 h-4 bg-zinc-800 rounded-full mx-auto mb-6" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center my-2 text-zinc-300", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-4xl font-extralight tracking-tight font-sans", children: previewSlot.labelHora }), (0, jsx_runtime_1.jsx)("div", { className: "text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5", children: dataFiltro.toLocaleDateString("pt-BR", { weekday: "long", month: "short", day: "numeric" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 p-3 backdrop-blur shadow-lg space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-[11px] text-zinc-400", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 font-semibold text-zinc-300", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-4 h-4 rounded bg-emerald-500 text-black flex items-center justify-center text-[10px] font-black", children: "P" }), (0, jsx_runtime_1.jsx)("span", { children: "DIREITO PRIME" })] }), (0, jsx_runtime_1.jsx)("span", { children: "agora" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs font-bold text-white leading-snug", children: previewSlot.tituloPadrao }), (0, jsx_runtime_1.jsx)("div", { className: "text-[11px] text-zinc-300 leading-relaxed mt-0.5 line-clamp-2", children: previewSlot.corpoPadrao })] }), previewSlot.capaPadrao && ((0, jsx_runtime_1.jsx)("img", { src: previewSlot.capaPadrao, alt: "Capa do push", className: "w-full h-24 object-cover rounded-xl border border-zinc-800" }))] }), (0, jsx_runtime_1.jsx)("div", { className: "w-24 h-1 bg-zinc-700 rounded-full mx-auto mt-12" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center text-xs text-zinc-400", children: ["Gatilho: ", (0, jsx_runtime_1.jsx)("code", { className: "text-emerald-400 font-mono", children: previewSlot.funcaoEdge })] })] })), (0, jsx_runtime_1.jsx)(dialog_1.DialogFooter, { children: (0, jsx_runtime_1.jsxs)(button_1.Button, { className: "w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl", onClick: function () {
                                    if (previewSlot)
                                        testarAdmin(previewSlot);
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FlaskConical, { className: "w-4 h-4 mr-1.5" }), " Disparar Teste Real para Admin"] }) })] }) }), (0, jsx_runtime_1.jsx)(dialog_1.Dialog, { open: modalNovoPush, onOpenChange: setModalNovoPush, children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogContent, { className: "max-w-lg bg-zinc-950 border-zinc-800 text-white rounded-3xl p-5", children: [(0, jsx_runtime_1.jsx)(dialog_1.DialogHeader, { children: (0, jsx_runtime_1.jsxs)(dialog_1.DialogTitle, { className: "text-base font-bold flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: "w-4 h-4 text-emerald-400" }), " Compor Novo Disparo Manual"] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 py-1 text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-zinc-400 font-semibold block mb-1", children: "T\u00EDtulo da Notifica\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)(input_1.Input, { value: novoTitulo, onChange: function (e) { return setNovoTitulo(e.target.value); }, placeholder: "Ex: \uD83D\uDCDC Nova Lei de Impacto Publicada Hoje", className: "bg-zinc-900 border-zinc-800 text-white rounded-xl text-xs h-9" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-zinc-400 font-semibold block mb-1", children: "Mensagem (Corpo)" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { value: novoCorpo, onChange: function (e) { return setNovoCorpo(e.target.value); }, placeholder: "Ex: Atos normativos acabam de ser catalogados no Radar 360...", className: "bg-zinc-900 border-zinc-800 text-white rounded-xl text-xs resize-none", rows: 3 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-zinc-400 font-semibold block mb-1", children: "Destino (Deep Link)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { value: novoUrl, onChange: function (e) { return setNovoUrl(e.target.value); }, placeholder: "/radar-360", className: "bg-zinc-900 border-zinc-800 text-white rounded-xl text-xs h-9 font-mono" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-zinc-400 font-semibold block mb-1", children: "P\u00FAblico Alvo" }), (0, jsx_runtime_1.jsxs)("select", { value: novoPublico, onChange: function (e) { return setNovoPublico(e.target.value); }, className: "w-full h-9 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-xs px-2.5 outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "Todos os usu\u00E1rios (Geral)" }), (0, jsx_runtime_1.jsx)("option", { value: "premium", children: "Apenas Assinantes Premium" }), (0, jsx_runtime_1.jsx)("option", { value: "free", children: "Apenas Usu\u00E1rios Gratuitos" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-zinc-400 font-semibold block mb-1", children: "Capa da Notifica\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-2", children: [
                                                { label: "Radar Leis", url: "/assets/push/capa-radar-leis.webp" },
                                                { label: "Notícias", url: "/assets/push/capa-noticias-juridicas.webp" },
                                                { label: "Hórus / Estudo", url: "/assets/push/capa-estudo-horus.webp" },
                                            ].map(function (capa) { return ((0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: function () { return setNovoImagem(capa.url); }, className: "p-1.5 rounded-xl border text-left transition-all ".concat(novoImagem === capa.url ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/60"), children: [(0, jsx_runtime_1.jsx)("img", { src: capa.url, alt: "", className: "w-full h-12 object-cover rounded-lg mb-1" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-zinc-300 font-medium truncate block", children: capa.label })] }, capa.url)); }) })] })] }), (0, jsx_runtime_1.jsxs)(dialog_1.DialogFooter, { className: "gap-2 sm:gap-0", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", onClick: function () { return setModalNovoPush(false); }, className: "rounded-xl border-zinc-800 text-zinc-300 hover:bg-zinc-900", children: "Cancelar" }), (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: enviarPushManual, disabled: enviandoManual, className: "bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: "w-4 h-4 mr-1.5" }), enviandoManual ? "Disparando..." : "Disparar Push Agora"] })] })] }) })] }));
}
