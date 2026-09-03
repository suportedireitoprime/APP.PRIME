import SwiftUI

struct FlashcardItemModel: Identifiable {
    let id: String
    let pergunta: String
    let resposta: String
    let area: String
    var tema: String = ""
    var subtema: String = ""
    var exemplo: String = ""
    var baseLegal: String = ""
    var dica: String = ""
    var artigoNumero: String = ""
}

struct FlashcardsView: View {
    let titulo: String
    let cards: [FlashcardItemModel]
    let startIndex: Int
    let onCardAnswered: (String, String, String, String) -> Void
    let onSessionCompleted: (Int, Int, Int) -> Void
    let onClose: () -> Void

    @State private var currentIndex: Int = 0
    @State private var isFlipped: Bool = false
    @State private var dragOffset: CGSize = .zero
    @State private var showDica: Bool = false
    @State private var compreendidosCount: Int = 0
    @State private var revisarCount: Int = 0
    @State private var isCompleted: Bool = false

    private let hapticImpact = UIImpactFeedbackGenerator(style: .medium)

    init(
        titulo: String,
        cards: [FlashcardItemModel],
        startIndex: Int = 0,
        onCardAnswered: @escaping (String, String, String, String) -> Void,
        onSessionCompleted: @escaping (Int, Int, Int) -> Void,
        onClose: @escaping () -> Void
    ) {
        self.titulo = titulo
        self.cards = cards
        self.startIndex = startIndex
        self.onCardAnswered = onCardAnswered
        self.onSessionCompleted = onSessionCompleted
        self.onClose = onClose
        _currentIndex = State(initialValue: min(max(0, startIndex), max(0, cards.count - 1)))
        _isCompleted = State(initialValue: cards.isEmpty)
    }

    private var currentCard: FlashcardItemModel? {
        guard !cards.isEmpty, currentIndex < cards.count else { return nil }
        return cards[currentIndex]
    }

    private func responder(status: String) {
        guard let card = currentCard else { return }
        hapticImpact.impactOccurred()

        if status == "compreendido" {
            compreendidosCount += 1
        } else {
            revisarCount += 1
        }

        onCardAnswered(card.id, status, card.area, card.tema)

        withAnimation(.easeOut(duration: 0.25)) {
            dragOffset = CGSize(width: status == "compreendido" ? 600 : -600, height: 0)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            isFlipped = false
            showDica = false
            dragOffset = .zero

            if currentIndex + 1 < cards.count {
                currentIndex += 1
            } else {
                isCompleted = true
                onSessionCompleted(cards.count, compreendidosCount, revisarCount)
            }
        }
    }

    var body: some View {
        ZStack {
            // Fundo escuro vinho clássico do app
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.54, green: 0.06, blue: 0.10),
                    Color(red: 0.29, green: 0.02, blue: 0.04),
                    Color(red: 0.08, green: 0.01, blue: 0.02),
                    Color(red: 0.05, green: 0.05, blue: 0.05)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            .edgesIgnoringSafeArea(.all)

            if isCompleted {
                // ── TELA DE SESSÃO CONCLUÍDA ─────────────────────────────
                VStack(spacing: 24) {
                    Spacer()

                    Text("🏆")
                        .font(.system(size: 72))

                    Text("Sessão Concluída!")
                        .font(.system(size: 28, weight: .bold, design: .serif))
                        .foregroundColor(.white)

                    Text("Você finalizou todos os flashcards deste bloco com sucesso.")
                        .font(.system(size: 14))
                        .foregroundColor(Color.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)

                    // Placar
                    HStack(spacing: 16) {
                        VStack(spacing: 6) {
                            Text("Compreendidos")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(red: 0.20, green: 0.83, blue: 0.60))
                            Text("\(compreendidosCount)")
                                .font(.system(size: 32, weight: .black))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color(red: 0.02, green: 0.31, blue: 0.23).opacity(0.4))
                        .cornerRadius(20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color(red: 0.20, green: 0.83, blue: 0.60).opacity(0.3), lineWidth: 1)
                        )

                        VStack(spacing: 6) {
                            Text("A Revisar")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44))
                            Text("\(revisarCount)")
                                .font(.system(size: 32, weight: .black))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color(red: 0.50, green: 0.11, blue: 0.11).opacity(0.4))
                        .cornerRadius(20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color(red: 0.97, green: 0.44, blue: 0.44).opacity(0.3), lineWidth: 1)
                        )
                    }
                    .padding(.horizontal, 24)

                    Spacer()

                    VStack(spacing: 12) {
                        Button(action: onClose) {
                            Text("CONCLUIR")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 54)
                                .background(Color(red: 0.72, green: 0.11, blue: 0.11))
                                .cornerRadius(16)
                        }

                        Button(action: {
                            currentIndex = 0
                            compreendidosCount = 0
                            revisarCount = 0
                            isCompleted = false
                        }) {
                            Text("REINICIAR BLOCO")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 54)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(16)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 24)
                }
            } else if let card = currentCard {
                // ── FLUXO DE REVISÃO ATIVA DOS FLASHCARDS ─────────────────
                VStack(spacing: 16) {
                    // Top Bar
                    HStack {
                        Button(action: onClose) {
                            Circle()
                                .fill(Color.black.opacity(0.45))
                                .frame(width: 48, height: 48)
                                .overlay(
                                    Circle().stroke(Color.white.opacity(0.15), lineWidth: 1)
                                )
                                .overlay(
                                    Image(systemName: "arrow.backward")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                )
                        }

                        Spacer()

                        VStack(spacing: 2) {
                            Text(titulo.uppercased())
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                                .lineLimit(1)

                            Text("Card \(currentIndex + 1) de \(cards.count)")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(Color.white.opacity(0.6))
                        }

                        Spacer()

                        Circle()
                            .fill(Color.clear)
                            .frame(width: 48, height: 48)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    // Barra de Progresso
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.12))
                                .frame(height: 6)

                            Capsule()
                                .fill(Color(red: 0.20, green: 0.83, blue: 0.60))
                                .frame(width: geo.size.width * CGFloat(currentIndex + 1) / CGFloat(max(1, cards.count)), height: 6)
                        }
                    }
                    .frame(height: 6)
                    .padding(.horizontal, 16)

                    Spacer().frame(height: 8)

                    // Card Central 3D Interativo
                    ZStack {
                        // Conteúdo Frente / Verso
                        if !isFlipped {
                            // FRENTE (Pergunta)
                            VStack(alignment: .leading, spacing: 18) {
                                HStack {
                                    Text(card.area.uppercased())
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 4)
                                        .background(Color(red: 0.96, green: 0.62, blue: 0.04).opacity(0.15))
                                        .cornerRadius(8)

                                    Spacer()

                                    if !card.artigoNumero.isEmpty {
                                        Text("Art. \(card.artigoNumero)")
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundColor(Color.white.opacity(0.7))
                                    }
                                }

                                if !card.tema.isEmpty {
                                    Text(card.tema)
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundColor(Color.white.opacity(0.5))
                                }

                                Text(card.pergunta)
                                    .font(.system(size: 19, weight: .semibold))
                                    .foregroundColor(.white)
                                    .lineSpacing(4)
                                    .padding(.vertical, 10)

                                if !card.dica.isEmpty {
                                    if showDica {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("💡 Dica:")
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundColor(Color(red: 0.99, green: 0.83, blue: 0.30))
                                            Text(card.dica)
                                                .font(.system(size: 12))
                                                .foregroundColor(Color(red: 0.99, green: 0.90, blue: 0.54))
                                        }
                                        .padding(12)
                                        .background(Color(red: 0.99, green: 0.83, blue: 0.30).opacity(0.12))
                                        .cornerRadius(12)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .stroke(Color(red: 0.99, green: 0.83, blue: 0.30).opacity(0.3), lineWidth: 1)
                                        )
                                    } else {
                                        Button(action: {
                                            hapticImpact.impactOccurred()
                                            withAnimation { showDica = true }
                                        }) {
                                            Text("💡 Ver dica")
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundColor(Color(red: 0.99, green: 0.83, blue: 0.30))
                                        }
                                    }
                                }

                                Spacer()

                                HStack {
                                    Spacer()
                                    Text("Toque no card para virar ↺")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundColor(Color.white.opacity(0.4))
                                    Spacer()
                                }
                            }
                            .padding(24)
                        } else {
                            // VERSO (Resposta)
                            VStack(alignment: .leading, spacing: 14) {
                                Text("RESPOSTA")
                                    .font(.system(size: 11, weight: .black))
                                    .tracking(1.2)
                                    .foregroundColor(Color(red: 0.20, green: 0.83, blue: 0.60))

                                Text(card.resposta)
                                    .font(.system(size: 16, weight: .regular))
                                    .foregroundColor(.white)
                                    .lineSpacing(4)

                                if !card.baseLegal.isEmpty {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("⚖️ Base Legal:")
                                            .font(.system(size: 11, weight: .bold))
                                            .foregroundColor(Color(red: 0.99, green: 0.65, blue: 0.65))
                                        Text(card.baseLegal)
                                            .font(.system(size: 12))
                                            .foregroundColor(Color(red: 0.99, green: 0.65, blue: 0.65))
                                    }
                                    .padding(10)
                                    .background(Color(red: 0.54, green: 0.06, blue: 0.10).opacity(0.25))
                                    .cornerRadius(12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color(red: 0.54, green: 0.06, blue: 0.10).opacity(0.4), lineWidth: 1)
                                    )
                                }

                                if !card.exemplo.isEmpty {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("📖 Exemplo:")
                                            .font(.system(size: 11, weight: .bold))
                                            .foregroundColor(Color.white.opacity(0.7))
                                        Text(card.exemplo)
                                            .font(.system(size: 12))
                                            .foregroundColor(Color.white.opacity(0.85))
                                    }
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(12)
                                }

                                Spacer()

                                HStack {
                                    Spacer()
                                    Text("Deslize ou use os botões abaixo")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundColor(Color.white.opacity(0.4))
                                    Spacer()
                                }
                            }
                            .padding(24)
                            .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(red: 0.08, green: 0.08, blue: 0.09))
                    .cornerRadius(28)
                    .overlay(
                        RoundedRectangle(cornerRadius: 28)
                            .stroke(
                                dragOffset.width > 50 ? Color(red: 0.20, green: 0.83, blue: 0.60) :
                                dragOffset.width < -50 ? Color(red: 0.97, green: 0.44, blue: 0.44) :
                                Color.white.opacity(0.14),
                                lineWidth: 1.5
                            )
                    )
                    .shadow(color: Color.black.opacity(0.5), radius: 20, x: 0, y: 10)
                    .rotation3DEffect(.degrees(isFlipped ? 180 : 0), axis: (x: 0, y: 1, z: 0))
                    .offset(x: dragOffset.width, y: dragOffset.height)
                    .rotationEffect(.degrees(Double(dragOffset.width / 25)))
                    .gesture(
                        DragGesture()
                            .onChanged { gesture in
                                dragOffset = gesture.translation
                            }
                            .onEnded { gesture in
                                if gesture.translation.width > 120 {
                                    responder(status: "compreendido")
                                } else if gesture.translation.width < -120 {
                                    responder(status: "revisar")
                                } else {
                                    withAnimation(.spring()) {
                                        dragOffset = .zero
                                    }
                                }
                            }
                    )
                    .onTapGesture {
                        hapticImpact.impactOccurred()
                        withAnimation(.easeInOut(duration: 0.35)) {
                            isFlipped.toggle()
                        }
                    }
                    .padding(.horizontal, 16)

                    // ── DOCK INFERIOR (REVISAR / VIRAR / COMPREENDI) ─────────
                    HStack(spacing: 12) {
                        Button(action: { responder(status: "revisar") }) {
                            HStack(spacing: 6) {
                                Image(systemName: "xmark")
                                    .font(.system(size: 14, weight: .bold))
                                Text("REVISAR")
                                    .font(.system(size: 13, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(Color(red: 0.60, green: 0.11, blue: 0.11))
                            .cornerRadius(18)
                        }

                        Button(action: {
                            hapticImpact.impactOccurred()
                            withAnimation(.easeInOut(duration: 0.35)) {
                                isFlipped.toggle()
                            }
                        }) {
                            Circle()
                                .fill(Color.white.opacity(0.12))
                                .frame(width: 54, height: 54)
                                .overlay(
                                    Circle().stroke(Color.white.opacity(0.2), lineWidth: 1)
                                )
                                .overlay(
                                    Image(systemName: "arrow.triangle.2.circlepath")
                                        .font(.system(size: 20, weight: .bold))
                                        .foregroundColor(.white)
                                )
                        }

                        Button(action: { responder(status: "compreendido") }) {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 14, weight: .bold))
                                Text("COMPREENDI")
                                    .font(.system(size: 13, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(Color(red: 0.02, green: 0.59, blue: 0.41))
                            .cornerRadius(18)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                }
            }
        }
    }
}
