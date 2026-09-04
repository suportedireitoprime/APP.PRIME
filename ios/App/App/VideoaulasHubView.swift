import SwiftUI

struct HubDisciplineCard: Identifiable {
    let id: String
    let titulo: String
    let area: String
    let aulasCount: Int
    let videoId: String
    let corHex: String
    let iconName: String
}

struct VideoaulasHubView: View {
    let onClose: () -> Void
    let onOpenVideo: (NativeVideoaulaItem) -> Void
    let onProgressUpdate: (String, Int, Int, Bool) -> Void

    @State private var selectedTab: Int = 0
    @State private var searchQuery: String = ""
    @State private var activeVideoForPlayer: NativeVideoaulaItem? = nil

    private let hapticSelection = UISelectionFeedbackGenerator()
    private let hapticImpact = UIImpactFeedbackGenerator(style: .medium)

    private let catalogoDisciplinas: [HubDisciplineCard] = [
        HubDisciplineCard(id: "dp", titulo: "Direito Penal: Teoria do Delito e Tipicidade", area: "Direito Penal", aulasCount: 12, videoId: "dQw4w9WgXcQ", corHex: "#EF4444", iconName: "shield.fill"),
        HubDisciplineCard(id: "dc", titulo: "Direito Constitucional: Controle de Constitucionalidade", area: "Direito Constitucional", aulasCount: 16, videoId: "dQw4w9WgXcQ", corHex: "#3B82F6", iconName: "building.columns.fill"),
        HubDisciplineCard(id: "dcv", titulo: "Direito Civil: Obrigações e Contratos", area: "Direito Civil", aulasCount: 14, videoId: "dQw4w9WgXcQ", corHex: "#10B981", iconName: "doc.plaintext.fill"),
        HubDisciplineCard(id: "dpp", titulo: "Processo Penal: Inquérito e Prisão em Flagrante", area: "Processo Penal", aulasCount: 10, videoId: "dQw4w9WgXcQ", corHex: "#F59E0B", iconName: "hand.raised.fill"),
        HubDisciplineCard(id: "dpc", titulo: "Processo Civil: Petição Inicial e Tutelas Provisórias", area: "Processo Civil", aulasCount: 15, videoId: "dQw4w9WgXcQ", corHex: "#8B5CF6", iconName: "folder.fill"),
        HubDisciplineCard(id: "dt", titulo: "Direito do Trabalho: Relação de Emprego e Verbas", area: "Direito do Trabalho", aulasCount: 9, videoId: "dQw4w9WgXcQ", corHex: "#EC4899", iconName: "briefcase.fill"),
        HubDisciplineCard(id: "dadm", titulo: "Direito Administrativo: Atos e Licitações 14.133", area: "Direito Administrativo", aulasCount: 11, videoId: "dQw4w9WgXcQ", corHex: "#06B6D4", iconName: "scroll.fill"),
        HubDisciplineCard(id: "dtrib", titulo: "Direito Tributário: Competência e Limitações", area: "Direito Tributário", aulasCount: 8, videoId: "dQw4w9WgXcQ", corHex: "#6366F1", iconName: "banknote.fill")
    ]

    private var filteredDisciplinas: [HubDisciplineCard] {
        if searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return catalogoDisciplinas
        }
        return catalogoDisciplinas.filter {
            $0.titulo.localizedCaseInsensitiveContains(searchQuery) ||
            $0.area.localizedCaseInsensitiveContains(searchQuery)
        }
    }

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.06).edgesIgnoringSafeArea(.all)

            VStack(spacing: 0) {
                // ── Top Bar ───────────────────────────────────────────
                HStack(spacing: 14) {
                    Button(action: {
                        hapticImpact.impactOccurred()
                        onClose()
                    }) {
                        Image(systemName: "arrow.left")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color(white: 0.12))
                            .clipShape(Circle())
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("VIDEOAULAS")
                            .font(.system(size: 16, weight: .black))
                            .tracking(1.5)
                            .foregroundColor(.white)
                        Text("CURADORIA EXCLUSIVA EM VÍDEO")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(0.5)
                            .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                    }

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 12)
                .background(Color(red: 0.08, green: 0.08, blue: 0.09))

                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 20) {
                        // ── Banner Métricas Hero ───────────────────────────
                        HStack(spacing: 12) {
                            metricItem(title: "Assistidas", value: "14h", icon: "clock.fill", color: Color(red: 0.96, green: 0.62, blue: 0.04))
                            metricItem(title: "Concluídas", value: "28", icon: "checkmark.seal.fill", color: Color(red: 0.06, green: 0.71, blue: 0.51))
                            metricItem(title: "Áreas Ativas", value: "6", icon: "play.tv.fill", color: Color(red: 0.23, green: 0.51, blue: 0.96))
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 14)

                        // ── Campo de Pesquisa ─────────────────────────────
                        HStack(spacing: 10) {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(Color.gray)
                                .font(.system(size: 15))

                            TextField("Buscar aula, tema ou disciplina...", text: $searchQuery)
                                .font(.system(size: 14))
                                .foregroundColor(.white)

                            if !searchQuery.isEmpty {
                                Button(action: { searchQuery = "" }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(Color.gray)
                                }
                            }
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(Color(white: 0.10))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(white: 0.18), lineWidth: 1)
                        )
                        .padding(.horizontal, 16)

                        // ── Tabs Seletoras ────────────────────────────────
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                tabButton(index: 0, title: "Áreas do Direito")
                                tabButton(index: 1, title: "OAB 1ª Fase")
                                tabButton(index: 2, title: "OAB 2ª Fase")
                                tabButton(index: 3, title: "Iniciantes")
                            }
                            .padding(.horizontal, 16)
                        }

                        // ── Lista de Disciplinas ──────────────────────────
                        VStack(alignment: .leading, spacing: 14) {
                            Text("DISCIPLINAS E TRILHAS DISPONÍVEIS")
                                .font(.system(size: 11, weight: .bold))
                                .tracking(1)
                                .foregroundColor(Color.gray)
                                .padding(.horizontal, 16)

                            ForEach(filteredDisciplinas) { disc in
                                disciplineCardView(disc: disc)
                            }
                        }
                        .padding(.bottom, 32)
                    }
                }
            }
        }
        .fullScreenCover(item: $activeVideoForPlayer) { aula in
            VideoaulaPlayerView(
                aula: aula,
                playlist: [
                    aula,
                    NativeVideoaulaItem(id: "p2", videoId: aula.videoId, titulo: "Aula 2 - Aplicação Prática e Jurisprudência", area: aula.area, duracaoSegundos: 1600, descricao: "Estudos de casos reais dos tribunais."),
                    NativeVideoaulaItem(id: "p3", videoId: aula.videoId, titulo: "Aula 3 - Resolução de Questões OAB & Concursos", area: aula.area, duracaoSegundos: 1900, descricao: "Fixação e análise de pegadinhas frequentes.")
                ],
                onProgressUpdate: { current, dur, completed in
                    onProgressUpdate(aula.id, current, dur, completed)
                },
                onClose: {
                    activeVideoForPlayer = nil
                }
            )
        }
    }

    private func metricItem(title: String, value: String, icon: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                    .foregroundColor(color)
                Text(title)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color.gray)
            }
            Text(value)
                .font(.system(size: 18, weight: .black))
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color(white: 0.08))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(white: 0.16), lineWidth: 1)
        )
    }

    private func tabButton(index: Int, title: String) -> some View {
        let isSelected = selectedTab == index
        return Button(action: {
            hapticSelection.selectionChanged()
            selectedTab = index
        }) {
            Text(title)
                .font(.system(size: 13, weight: isSelected ? .bold : .medium))
                .foregroundColor(isSelected ? .black : Color.gray)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color(red: 0.96, green: 0.62, blue: 0.04) : Color(white: 0.10))
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isSelected ? Color.clear : Color(white: 0.16), lineWidth: 1)
                )
        }
    }

    private func disciplineCardView(disc: HubDisciplineCard) -> some View {
        Button(action: {
            hapticImpact.impactOccurred()
            let item = NativeVideoaulaItem(
                id: disc.id,
                videoId: disc.videoId,
                titulo: disc.titulo,
                area: disc.area,
                duracaoSegundos: 1800,
                descricao: "Trilha completa e especializada em \(disc.area) ministrada pelos maiores juristas do país."
            )
            onOpenVideo(item)
            activeVideoForPlayer = item
        }) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(white: 0.12))
                        .frame(width: 50, height: 50)

                    Image(systemName: disc.iconName)
                        .font(.system(size: 20))
                        .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(disc.area.uppercased())
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                        .tracking(0.5)

                    Text(disc.titulo)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 6) {
                        Text("\(disc.aulasCount) aulas completas")
                            .font(.system(size: 11))
                            .foregroundColor(Color.gray)
                        Text("•")
                            .foregroundColor(Color.gray)
                        Text("Full HD 1080p")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(Color(red: 0.06, green: 0.71, blue: 0.51))
                    }
                }

                Spacer()

                Image(systemName: "play.circle.fill")
                    .font(.system(size: 26))
                    .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
            }
            .padding(14)
            .background(Color(white: 0.08))
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color(white: 0.15), lineWidth: 1)
            )
            .padding(.horizontal, 16)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
