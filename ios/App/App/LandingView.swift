import SwiftUI

struct LandingFeature: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let iconName: String
    let color: Color
}

struct LandingFaq: Identifiable {
    let id = UUID()
    let question: String
    let answer: String
}

struct LandingView: View {
    var onOpenAuth: (String) -> Void
    var onClose: () -> Void

    private let universities = [
        "USP", "FGV Direito", "PUC-SP", "Mackenzie", "UERJ", "UFRJ", "UFMG", "UnB", "UFPE", "PUC-RS", "UFSC"
    ]

    private let features: [LandingFeature] = [
        LandingFeature(
            title: "Vade Mecum 100% Atualizado",
            description: "Códigos e leis do Planalto com grifos nativos a 120fps, áudio sincronizado e busca instantânea.",
            iconName: "book.closed.fill",
            color: Color(hex: "#F59E0B")
        ),
        LandingFeature(
            title: "Me Explique com IA Visual",
            description: "Aponte a câmera para qualquer doutrina, artigo ou caderno e tire dúvidas em tempo real.",
            iconName: "camera.viewfinder",
            color: Color(hex: "#9333EA")
        ),
        LandingFeature(
            title: "OAB 1ª e 2ª Fase & Concursos",
            description: "Milhares de questões comentadas, simulados de peças práticas e acompanhamento de metas.",
            iconName: "building.columns.fill",
            color: Color(hex: "#3B82F6")
        ),
        LandingFeature(
            title: "Flashcards e Repetição Espaçada",
            description: "Memorização ativa dos artigos mais cobrados sem decoreba inútil.",
            iconName: "sparkles",
            color: Color(hex: "#10B981")
        ),
        LandingFeature(
            title: "Leis Cantadas & Áudio em Background",
            description: "Estude no trânsito ou na academia com narrações completas e mnemônicos musicais.",
            iconName: "headphones",
            color: Color(hex: "#EC4899")
        )
    ]

    private let faqs: [LandingFaq] = [
        LandingFaq(
            question: "O app é gratuito para começar?",
            answer: "Sim, você pode testar e explorar gratuitamente. Para recursos ilimitados, o app conta com o plano PRIME super acessível."
        ),
        LandingFaq(
            question: "A legislação é realmente atualizada?",
            answer: "Sim! Todas as leis são sincronizadas diretamente com o Diário Oficial e o Planalto, mantendo você seguro para provas e prática."
        ),
        LandingFaq(
            question: "Funciona offline?",
            answer: "Sim! O Vade Mecum, anotações e flashcards contam com armazenamento nativo no dispositivo para você estudar mesmo sem sinal."
        )
    ]

    @State private var expandedFaqId: UUID? = nil

    var body: some View {
        ZStack(alignment: .bottom) {
            Color(hex: "#0D0D0D").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    // Top Bar
                    HStack {
                        HStack(spacing: 8) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(LinearGradient(
                                        colors: [Color(hex: "#9333EA"), Color(hex: "#6B21A8")],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ))
                                    .frame(width: 34, height: 34)

                                Image(systemName: "scale.3d")
                                    .font(.system(size: 16))
                                    .foregroundColor(.white)
                            }

                            Text("DIREITO PRIME")
                                .font(.system(size: 15, weight: .black))
                                .foregroundColor(.white)
                                .tracking(1)
                        }

                        Spacer()

                        Button(action: {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            onOpenAuth("login")
                        }) {
                            Text("Entrar")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(Color(hex: "#F59E0B"))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)

                    // Hero Headline
                    VStack(spacing: 12) {
                        Text("O ECOSSISTEMA JURÍDICO Nº 1 DO BRASIL")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(Color(hex: "#F59E0B"))
                            .tracking(1.5)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .background(Color(hex: "#F59E0B").opacity(0.12))
                            .cornerRadius(50)
                            .overlay(RoundedRectangle(cornerRadius: 50).stroke(Color(hex: "#F59E0B").opacity(0.3), lineWidth: 1))

                        Text("Sua Aprovação na Faculdade e na OAB Começa Aqui")
                            .font(.system(size: 28, weight: .black))
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                            .padding(.horizontal, 16)

                        Text("Vade Mecum fluido a 120fps, IA jurídica visual, áudios em segundo plano e simulados personalizados.")
                            .font(.system(size: 15))
                            .foregroundColor(Color(hex: "#A1A1AA"))
                            .multilineTextAlignment(.center)
                            .lineSpacing(3)
                            .padding(.horizontal, 24)
                    }

                    // Universities Horizontal Scroller
                    VStack(spacing: 8) {
                        Text("UTILIZADO POR ALUNOS E ADVOGADOS DE TODO O BRASIL")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(Color(hex: "#71717A"))
                            .tracking(1.5)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(universities, id: \.self) { uni in
                                    Text(uni)
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(Color(hex: "#E4E4E7"))
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color(hex: "#18181B"))
                                        .cornerRadius(10)
                                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: "#27272A"), lineWidth: 1))
                                }
                            }
                            .padding(.horizontal, 20)
                        }
                    }

                    // Features List
                    VStack(alignment: .leading, spacing: 14) {
                        Text("TUDO QUE VOCÊ PRECISA EM UM SÓ LUGAR")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(Color(hex: "#F59E0B"))
                            .tracking(1.5)
                            .padding(.horizontal, 20)

                        ForEach(features) { feat in
                            HStack(alignment: .top, spacing: 14) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(feat.color.opacity(0.15))
                                        .frame(width: 44, height: 44)

                                    Image(systemName: feat.iconName)
                                        .font(.system(size: 20))
                                        .foregroundColor(feat.color)
                                }

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(feat.title)
                                        .font(.system(size: 16, weight: .black))
                                        .foregroundColor(.white)

                                    Text(feat.description)
                                        .font(.system(size: 13))
                                        .foregroundColor(Color(hex: "#A1A1AA"))
                                        .lineSpacing(2)
                                }

                                Spacer()
                            }
                            .padding(16)
                            .background(Color(hex: "#18181B"))
                            .cornerRadius(20)
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color(hex: "#27272A"), lineWidth: 1))
                            .padding(.horizontal, 20)
                        }
                    }

                    // FAQ Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("PERGUNTAS FREQUENTES")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(Color(hex: "#F59E0B"))
                            .tracking(1.5)
                            .padding(.horizontal, 20)

                        ForEach(faqs) { faq in
                            let isExpanded = expandedFaqId == faq.id

                            VStack(alignment: .leading, spacing: 10) {
                                Button(action: {
                                    withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                        expandedFaqId = isExpanded ? nil : faq.id
                                    }
                                }) {
                                    HStack {
                                        Text(faq.question)
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundColor(.white)
                                            .multilineTextAlignment(.leading)

                                        Spacer()

                                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(Color(hex: "#A1A1AA"))
                                    }
                                }

                                if isExpanded {
                                    Text(faq.answer)
                                        .font(.system(size: 13))
                                        .foregroundColor(Color(hex: "#A1A1AA"))
                                        .lineSpacing(3)
                                }
                            }
                            .padding(16)
                            .background(Color(hex: "#18181B"))
                            .cornerRadius(14)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#27272A"), lineWidth: 1))
                            .padding(.horizontal, 20)
                        }
                    }

                    Spacer().frame(height: 120)
                }
            }

            // Fixed Bottom CTA
            VStack(spacing: 8) {
                Button(action: {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    onOpenAuth("signup")
                }) {
                    Text("Começar Agora Gratuitamente")
                        .font(.system(size: 15, weight: .black))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Color(hex: "#9333EA"))
                        .cornerRadius(16)
                }

                Button(action: {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    onClose()
                }) {
                    Text("Explorar o app sem conta")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(hex: "#A1A1AA"))
                        .padding(.vertical, 4)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 24)
            .background(Color(hex: "#0D0D0D").opacity(0.95))
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(Color(hex: "#27272A")),
                alignment: .top
            )
        }
    }
}
