import SwiftUI

struct FlashcardsHubView: View {
    let onClose: () -> Void
    let onCardAnswered: (String, String, String, String) -> Void
    let onSessionCompleted: (Int, Int, Int) -> Void

    @State private var showFilterSheet: Bool = false
    @State private var activeSession: SessionConfig? = null
    @State private var selectedArea: String = "Todos"
    @State private var selectedQuantity: Int = 20

    private let hapticImpact = UIImpactFeedbackGenerator(style: .medium)

    let areas = [
        "Todos", "Direito Constitucional", "Direito Penal", "Direito Civil",
        "Direito Administrativo", "Direito Processual Civil", "Direito Processual Penal",
        "Direito Tributário", "Direito do Trabalho", "Direito Empresarial"
    ]

    struct SessionConfig: Identifiable {
        let id = UUID()
        let titulo: String
        let cards: [FlashcardItemModel]
    }

    var body: some View {
        ZStack {
            // Fundo escuro com gradiente clássico
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.16, green: 0.04, blue: 0.06),
                    Color(red: 0.09, green: 0.02, blue: 0.03),
                    Color(red: 0.05, green: 0.05, blue: 0.05)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            .edgesIgnoringSafeArea(.all)

            VStack(spacing: 0) {
                // ── Top Bar ───────────────────────────────────────────
                HStack {
                    Button(action: {
                        hapticImpact.impactOccurred()
                        onClose()
                    }) {
                        Image(systemName: "arrow.left")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 48, height: 48)
                            .background(Color.black.opacity(0.4))
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white.opacity(0.15), lineWidth: 1))
                    }

                    Spacer()

                    Text("FLASHCARDS")
                        .font(.system(size: 17, weight: .black))
                        .tracking(2)
                        .foregroundColor(.white)

                    Spacer()

                    // Espaçador para centralizar o título
                    Color.clear
                        .frame(width: 48, height: 48)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 8)

                // ── Conteúdo com Scroll ───────────────────────────────
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        // Hero Card de Desempenho
                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("SEU DESEMPENHO")
                                        .font(.system(size: 11, weight: .bold))
                                        .tracking(1)
                                        .foregroundColor(Color.gray)
                                    Text("68% Dominado")
                                        .font(.system(size: 24, weight: .black))
                                        .foregroundColor(.white)
                                }

                                Spacer()

                                HStack(spacing: 4) {
                                    Text("🔥")
                                    Text("5 dias")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundColor(Color(red: 0.98, green: 0.57, blue: 0.24))
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.orange.opacity(0.15))
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.orange.opacity(0.4), lineWidth: 1))
                            }

                            // Barra de Progresso
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color.white.opacity(0.1))
                                        .frame(height: 8)
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color(red: 0.21, green: 0.69, blue: 0.52))
                                        .frame(width: geo.size.width * 0.68, height: 8)
                                }
                            }
                            .frame(height: 8)

                            // Estatísticas mini
                            HStack {
                                StatMiniView(title: "Estudados", value: "140")
                                Spacer()
                                StatMiniView(title: "Hoje", value: "25")
                                Spacer()
                                StatMiniView(title: "Meta", value: "100")
                                Spacer()
                                StatMiniView(title: "Total", value: "3.500")
                            }
                        }
                        .padding(20)
                        .background(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color(red: 0.22, green: 0.05, blue: 0.08),
                                    Color(red: 0.12, green: 0.03, blue: 0.04)
                                ]),
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .cornerRadius(24)
                        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white.opacity(0.12), lineWidth: 1))

                        // Card "Praticar Flashcards" com Filtro Rápido
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 8) {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(Color(red: 0.21, green: 0.69, blue: 0.52))
                                    .frame(width: 4, height: 20)

                                Text("PRATICAR FLASHCARDS")
                                    .font(.system(size: 15, weight: .black))
                                    .tracking(1)
                                    .foregroundColor(.white)
                            }

                            Text("Filtre por matéria ou estude baralhos recomendados com repetição espaçada.")
                                .font(.system(size: 13))
                                .foregroundColor(Color.gray)

                            Button(action: {
                                hapticImpact.impactOccurred()
                                showFilterSheet = true
                            }) {
                                HStack {
                                    Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                        .font(.system(size: 18))
                                    Text("Filtro Rápido")
                                        .font(.system(size: 16, weight: .bold))
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 14, weight: .bold))
                                }
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .frame(height: 56)
                                .background(Color(red: 0.17, green: 0.58, blue: 0.44))
                                .cornerRadius(16)
                            }
                        }
                        .padding(20)
                        .background(Color(white: 0.08))
                        .cornerRadius(24)
                        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.white.opacity(0.08), lineWidth: 1))

                        // 4 Atalhos Rápidos
                        HStack(spacing: 10) {
                            ShortcutButton(icon: "clock.arrow.circlepath", label: "Histórico") {
                                hapticImpact.impactOccurred()
                            }
                            ShortcutButton(icon: "folder.fill", label: "Decks") {
                                hapticImpact.impactOccurred()
                            }
                            ShortcutButton(icon: "arrow.triangle.2.circlepath", label: "Revisão") {
                                hapticImpact.impactOccurred()
                                startMockSession(titulo: "Revisão Espaçada", count: 15)
                            }
                            ShortcutButton(icon: "chart.bar.fill", label: "Progresso") {
                                hapticImpact.impactOccurred()
                            }
                        }

                        // Recursos (Trilhas e Desafios)
                        VStack(alignment: .leading, spacing: 10) {
                            Text("RECURSOS")
                                .font(.system(size: 11, weight: .black))
                                .tracking(1)
                                .foregroundColor(Color.gray)

                            HStack(spacing: 12) {
                                FeatureButton(icon: "map.fill", title: "Trilhas", desc: "Passo a passo") {
                                    startMockSession(titulo: "Trilhas de Estudo", count: 10)
                                }
                                FeatureButton(icon: "trophy.fill", title: "Desafios", desc: "Linha do tempo") {
                                    startMockSession(titulo: "Desafios Semanais", count: 10)
                                }
                            }
                        }

                        // Frequência SRS (Últimos 30 Dias)
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("SUA FREQUÊNCIA (30 DIAS)")
                                    .font(.system(size: 11, weight: .bold))
                                    .tracking(1)
                                    .foregroundColor(Color.gray)
                                Spacer()
                                Text("SRS Ativo")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(Color(red: 0.21, green: 0.69, blue: 0.52))
                            }

                            HStack(spacing: 8) {
                                ForEach(0..<8) { i in
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(i % 3 == 0 ? Color(red: 0.21, green: 0.69, blue: 0.52) : Color.white.opacity(0.1))
                                        .frame(height: 28)
                                }
                            }
                        }
                        .padding(16)
                        .background(Color(white: 0.08))
                        .cornerRadius(20)
                        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.08), lineWidth: 1))

                        Spacer(modifier: .padding(.bottom, 32))
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                }
            }
        }
        .sheet(isPresented: $showFilterSheet) {
            FilterSheetView(
                areas: areas,
                selectedArea: $selectedArea,
                selectedQuantity: $selectedQuantity,
                onStart: {
                    showFilterSheet = false
                    startMockSession(titulo: selectedArea == "Todos" ? "Estudo Geral" : selectedArea, count: selectedQuantity)
                }
            )
        }
        .fullScreenCover(item: $activeSession) { session in
            FlashcardsView(
                titulo: session.titulo,
                cards: session.cards,
                startIndex: 0,
                onCardAnswered: onCardAnswered,
                onSessionCompleted: onSessionCompleted,
                onClose: {
                    activeSession = nil
                }
            )
        }
    }

    private func startMockSession(titulo: String, count: Int) {
        hapticImpact.impactOccurred()
        let sampleCards = (1...count).map { idx in
            FlashcardItemModel(
                id: "card_\(idx)_\(Date().timeIntervalSince1970)",
                pergunta: idx % 2 == 0 
                    ? "Qual é o conceito de Dolo Eventual no Código Penal?" 
                    : "Em que consiste o princípio da Insignificância segundo o STF?",
                resposta: idx % 2 == 0
                    ? "Ocorre quando o agente não quer diretamente o resultado ilícito, mas assume conscientemente o risco de produzi-lo (Art. 18, I, CP)."
                    : "Causa supralegal de exclusão da tipicidade material quando presentes os 4 vetores: mínima ofensividade, nenhuma periculosidade social, reduzidíssimo grau de reprovabilidade e inexpressividade da lesão.",
                area: selectedArea == "Todos" ? "Direito Penal" : selectedArea,
                tema: "Teoria do Crime",
                subtema: "Tipicidade",
                exemplo: "Exemplo clássico: 'Racha' em via pública de alta circulação.",
                baseLegal: "Art. 18, I, do CP",
                dica: "Diferente da culpa consciente onde o agente acredita sinceramente que o fato não acontecerá."
            )
        }
        activeSession = SessionConfig(titulo: titulo, cards: sampleCards)
    }
}

// ── Componentes Auxiliares SwiftUI ────────────────────────────────────

struct StatMiniView: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 16, weight: .black))
                .foregroundColor(.white)
            Text(title)
                .font(.system(size: 11))
                .foregroundColor(Color.gray)
        }
    }
}

struct ShortcutButton: View {
    let icon: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(Color.gray)
                Text(label)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color(white: 0.08))
            .cornerRadius(16)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.08), lineWidth: 1))
        }
    }
}

struct FeatureButton: View {
    let icon: String
    let title: String
    let desc: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(Color(red: 0.21, green: 0.69, blue: 0.52))
                Text(title)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                Text(desc)
                    .font(.system(size: 10))
                    .foregroundColor(Color.gray)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color(white: 0.08))
            .cornerRadius(18)
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.08), lineWidth: 1))
        }
    }
}

struct FilterSheetView: View {
    let areas: [String]
    @Binding var selectedArea: String
    @Binding var selectedQuantity: Int
    let onStart: () -> Void

    var body: some View {
        ZStack {
            Color(white: 0.09).edgesIgnoringSafeArea(.all)

            VStack(alignment: .leading, spacing: 20) {
                Text("Configurar Estudo")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.top, 16)

                Text("Área Jurídica")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(Color.gray)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(areas, id: \.self) { area in
                            let isSel = area == selectedArea
                            Button(action: { selectedArea = area }) {
                                Text(area)
                                    .font(.system(size: 13, weight: isSel ? .bold : .medium))
                                    .foregroundColor(isSel ? .white : Color.gray)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(isSel ? Color(red: 0.17, green: 0.58, blue: 0.44) : Color.white.opacity(0.08))
                                    .cornerRadius(20)
                            }
                        }
                    }
                }

                Text("Quantidade de Cards")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(Color.gray)

                HStack(spacing: 10) {
                    ForEach([10, 20, 30, 50], id: \.self) { qty in
                        let isSel = qty == selectedQuantity
                        Button(action: { selectedQuantity = qty }) {
                            Text("\(qty)")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(isSel ? .white : Color.gray)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(isSel ? Color(red: 0.17, green: 0.58, blue: 0.44) : Color.white.opacity(0.08))
                                .cornerRadius(12)
                        }
                    }
                }

                Spacer()

                Button(action: onStart) {
                    Text("Começar Sessão (\(selectedQuantity) cards)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Color(red: 0.17, green: 0.58, blue: 0.44))
                        .cornerRadius(14)
                }
                .padding(.bottom, 20)
            }
            .padding(24)
        }
    }
}
