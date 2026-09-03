import SwiftUI

struct QuestaoItemModel: Identifiable {
    let id: String
    let enunciado: String
    let altA: String
    let altB: String
    let altC: String
    let altD: String
    var altE: String = ""
    let gabaritoOficial: String
    var gabaritoComentado: String = ""
    var disciplina: String = ""
    var assunto: String = ""
    var ano: Int = 2024
    var banca: String = ""
    var orgao: String = ""
}

struct QuestoesView: View {
    let titulo: String
    let questoes: [QuestaoItemModel]
    let startIndex: Int
    let contexto: String
    let onQuestaoAnswered: (String, String, Bool, Int) -> Void
    let onSessionCompleted: (Int, Int, Int, Int) -> Void
    let onClose: () -> Void

    @State private var currentIndex: Int = 0
    @State private var selectedAlt: String? = nil
    @State private var isAnswered: Bool = false
    @State private var acertosCount: Int = 0
    @State private var errosCount: Int = 0
    @State private var totalSeconds: Int = 0
    @State private var questionSeconds: Int = 0
    @State private var isCompleted: Bool = false

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    private let hapticImpact = UIImpactFeedbackGenerator(style: .medium)

    init(
        titulo: String,
        questoes: [QuestaoItemModel],
        startIndex: Int = 0,
        contexto: String = "pratica",
        onQuestaoAnswered: @escaping (String, String, Bool, Int) -> Void,
        onSessionCompleted: @escaping (Int, Int, Int, Int) -> Void,
        onClose: @escaping () -> Void
    ) {
        self.titulo = titulo
        self.questoes = questoes
        self.startIndex = startIndex
        self.contexto = contexto
        self.onQuestaoAnswered = onQuestaoAnswered
        self.onSessionCompleted = onSessionCompleted
        self.onClose = onClose
        _currentIndex = State(initialValue: min(max(0, startIndex), max(0, questoes.count - 1)))
        _isCompleted = State(initialValue: questoes.isEmpty)
    }

    private var currentQuestao: QuestaoItemModel? {
        guard !questoes.isEmpty, currentIndex < questoes.count else { return nil }
        return questoes[currentIndex]
    }

    private func formatTimer(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }

    private func submitAnswer() {
        guard let q = currentQuestao, let alt = selectedAlt, !isAnswered else { return }
        hapticImpact.impactOccurred()

        let correta = q.gabaritoOficial.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let acertou = alt.trimmingCharacters(in: .whitespacesAndNewlines).uppercased() == correta

        if acertou {
            acertosCount += 1
        } else {
            errosCount += 1
        }

        withAnimation(.easeInOut(duration: 0.25)) {
            isAnswered = true
        }

        onQuestaoAnswered(q.id, alt, acertou, questionSeconds)
    }

    private func nextQuestion() {
        hapticImpact.impactOccurred()
        selectedAlt = nil
        isAnswered = false
        questionSeconds = 0

        if currentIndex + 1 < questoes.count {
            currentIndex += 1
        } else {
            isCompleted = true
            onSessionCompleted(questoes.count, acertosCount, errosCount, totalSeconds)
        }
    }

    var body: some View {
        ZStack {
            // Fundo escuro clássico
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
            .onReceive(timer) { _ in
                if !isCompleted {
                    totalSeconds += 1
                    questionSeconds += 1
                }
            }

            if isCompleted {
                // ── TELA DE FINALIZAÇÃO ───────────────────────────────
                VStack(spacing: 24) {
                    Spacer()

                    Text("🎯")
                        .font(.system(size: 72))

                    Text("Treino Finalizado!")
                        .font(.system(size: 28, weight: .bold, design: .serif))
                        .foregroundColor(.white)

                    Text("Tempo total de resolução: \(formatTimer(totalSeconds))")
                        .font(.system(size: 14))
                        .foregroundColor(Color.white.opacity(0.7))

                    // Placar
                    HStack(spacing: 16) {
                        VStack(spacing: 6) {
                            Text("Acertos")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(red: 0.20, green: 0.83, blue: 0.60))
                            Text("\(acertosCount)")
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
                            Text("Erros")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44))
                            Text("\(errosCount)")
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

                    Button(action: onClose) {
                        Text("CONCLUIR")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(Color(red: 0.72, green: 0.11, blue: 0.11))
                            .cornerRadius(16)
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 24)
                }
            } else if let q = currentQuestao {
                // ── RESOLUÇÃO DE QUESTÃO ─────────────────────────────
                VStack(spacing: 12) {
                    // Top Bar
                    HStack {
                        Button(action: onClose) {
                            Circle()
                                .fill(Color.black.opacity(0.45))
                                .frame(width: 48, height: 48)
                                .overlay(Circle().stroke(Color.white.opacity(0.15), lineWidth: 1))
                                .overlay(
                                    Image(systemName: "arrow.backward")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                )
                        }

                        Spacer()

                        VStack(spacing: 2) {
                            Text((q.disciplina.isEmpty ? titulo : q.disciplina).uppercased())
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                                .lineLimit(1)

                            Text("Questão \(currentIndex + 1) de \(questoes.count)")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(Color.white.opacity(0.6))
                        }

                        Spacer()

                        HStack(spacing: 4) {
                            Text("⏱ \(formatTimer(questionSeconds))")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(Color(red: 0.99, green: 0.90, blue: 0.54))
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.5))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.15), lineWidth: 1)
                        )
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    // Barra de Progresso
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.12))
                                .frame(height: 5)

                            Capsule()
                                .fill(Color(red: 0.94, green: 0.27, blue: 0.27))
                                .frame(width: geo.size.width * CGFloat(currentIndex + 1) / CGFloat(max(1, questoes.count)), height: 5)
                        }
                    }
                    .frame(height: 5)
                    .padding(.horizontal, 16)

                    // Scroll View com Enunciado e Alternativas
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            // Badge Banca
                            if !q.banca.isEmpty {
                                HStack {
                                    Text("\(q.banca) • \(q.ano)")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 4)
                                        .background(Color(red: 0.96, green: 0.62, blue: 0.04).opacity(0.15))
                                        .cornerRadius(8)

                                    Spacer()

                                    if !q.assunto.isEmpty {
                                        Text(q.assunto)
                                            .font(.system(size: 11))
                                            .foregroundColor(Color.white.opacity(0.6))
                                            .lineLimit(1)
                                    }
                                }
                            }

                            // Card do Enunciado
                            Text(q.enunciado)
                                .font(.system(size: 15))
                                .foregroundColor(.white)
                                .lineSpacing(4)
                                .padding(18)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(red: 0.08, green: 0.08, blue: 0.09).opacity(0.9))
                                .cornerRadius(20)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                )

                            // Alternativas
                            let alts: [(String, String)] = [
                                ("A", q.altA),
                                ("B", q.altB),
                                ("C", q.altC),
                                ("D", q.altD),
                                ("E", q.altE)
                            ].filter { !$0.1.isEmpty }

                            VStack(spacing: 10) {
                                ForEach(alts, id: \.0) { letra, texto in
                                    let isSelected = selectedAlt == letra
                                    let isCorreta = q.gabaritoOficial == letra

                                    Button(action: {
                                        guard !isAnswered else { return }
                                        hapticImpact.impactOccurred()
                                        selectedAlt = letra
                                    }) {
                                        HStack(alignment: .top, spacing: 12) {
                                            ZStack {
                                                Circle()
                                                    .fill(
                                                        isAnswered && isCorreta ? Color(red: 0.20, green: 0.83, blue: 0.60).opacity(0.25) :
                                                        isAnswered && isSelected && !isCorreta ? Color(red: 0.97, green: 0.44, blue: 0.44).opacity(0.25) :
                                                        isSelected ? Color.blue.opacity(0.25) :
                                                        Color.white.opacity(0.1)
                                                    )
                                                    .frame(width: 32, height: 32)
                                                    .overlay(
                                                        Circle().stroke(
                                                            isAnswered && isCorreta ? Color(red: 0.20, green: 0.83, blue: 0.60) :
                                                            isAnswered && isSelected && !isCorreta ? Color(red: 0.97, green: 0.44, blue: 0.44) :
                                                            isSelected ? Color.blue :
                                                            Color.white.opacity(0.15),
                                                            lineWidth: 1
                                                        )
                                                    )

                                                if isAnswered && isCorreta {
                                                    Image(systemName: "checkmark.circle.fill")
                                                        .foregroundColor(Color(red: 0.20, green: 0.83, blue: 0.60))
                                                } else if isAnswered && isSelected && !isCorreta {
                                                    Image(systemName: "xmark.circle.fill")
                                                        .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44))
                                                } else {
                                                    Text(letra)
                                                        .font(.system(size: 13, weight: .bold))
                                                        .foregroundColor(.white)
                                                }
                                            }

                                            Text(texto)
                                                .font(.system(size: 14))
                                                .foregroundColor(.white)
                                                .lineSpacing(3)
                                                .multilineTextAlignment(.leading)

                                            Spacer()
                                        }
                                        .padding(14)
                                        .background(
                                            isAnswered && isCorreta ? Color(red: 0.02, green: 0.31, blue: 0.23).opacity(0.7) :
                                            isAnswered && isSelected && !isCorreta ? Color(red: 0.50, green: 0.11, blue: 0.11).opacity(0.7) :
                                            isSelected ? Color(red: 0.12, green: 0.23, blue: 0.54).opacity(0.6) :
                                            Color(red: 0.10, green: 0.10, blue: 0.12).opacity(0.8)
                                        )
                                        .cornerRadius(16)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 16)
                                                .stroke(
                                                    isAnswered && isCorreta ? Color(red: 0.20, green: 0.83, blue: 0.60) :
                                                    isAnswered && isSelected && !isCorreta ? Color(red: 0.97, green: 0.44, blue: 0.44) :
                                                    isSelected ? Color.blue :
                                                    Color.white.opacity(0.12),
                                                    lineWidth: 1.5
                                                )
                                        )
                                    }
                                    .disabled(isAnswered)
                                }
                            }

                            // Gabarito Comentado
                            if isAnswered {
                                VStack(alignment: .leading, spacing: 10) {
                                    HStack {
                                        Text("GABARITO: LETRA \(q.gabaritoOficial)")
                                            .font(.system(size: 12, weight: .black))
                                            .foregroundColor(Color(red: 0.20, green: 0.83, blue: 0.60))

                                        Spacer()

                                        Text(selectedAlt == q.gabaritoOficial ? "Você Acertou! 👏" : "Você Errou")
                                            .font(.system(size: 11, weight: .bold))
                                            .foregroundColor(selectedAlt == q.gabaritoOficial ? Color(red: 0.20, green: 0.83, blue: 0.60) : Color(red: 0.97, green: 0.44, blue: 0.44))
                                    }

                                    if !q.gabaritoComentado.isEmpty {
                                        Text(q.gabaritoComentado)
                                            .font(.system(size: 13))
                                            .foregroundColor(Color.white.opacity(0.9))
                                            .lineSpacing(4)
                                    }
                                }
                                .padding(16)
                                .background(Color(red: 0.12, green: 0.12, blue: 0.14))
                                .cornerRadius(20)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(Color(red: 0.20, green: 0.83, blue: 0.60).opacity(0.3), lineWidth: 1)
                                )
                                .padding(.top, 8)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 20)
                    }

                    // Dock Inferior com Botão Primário
                    VStack {
                        if !isAnswered {
                            Button(action: submitAnswer) {
                                Text("RESPONDER")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(selectedAlt != nil ? .white : Color.white.opacity(0.4))
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 54)
                                    .background(selectedAlt != nil ? Color(red: 0.02, green: 0.59, blue: 0.41) : Color.white.opacity(0.1))
                                    .cornerRadius(16)
                            }
                            .disabled(selectedAlt == nil)
                        } else {
                            Button(action: nextQuestion) {
                                Text(currentIndex + 1 < questoes.count ? "PRÓXIMA QUESTÃO" : "VER RESULTADO")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 54)
                                    .background(Color(red: 0.72, green: 0.11, blue: 0.11))
                                    .cornerRadius(16)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 14)
                }
            }
        }
    }
}
