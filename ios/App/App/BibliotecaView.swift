import SwiftUI

struct SwiftLivro: Identifiable, Decodable {
    let id: String
    let titulo: String
    let autor: String?
    let sobre: String?
    let colecao: String?
    let area: String?
    let paginas: Int?
    let download: String?
}

struct BibliotecaView: View {
    let initialAba: String
    let initialMateria: String
    let initialLivroId: String
    let accessToken: String
    let onClose: () -> Void

    @State private var selectedAba: String = "acervos"
    @State private var searchQuery: String = ""
    @State private var isSearching: Bool = false
    @State private var selectedLivro: SwiftLivro? = nil
    @State private var livros: [SwiftLivro] = []
    @State private var isLoading: Bool = true

    private let hapticImpact = UIImpactFeedbackGenerator(style: .medium)

    private let abas: [(id: String, label: String)] = [
        ("acervos", "Todos os Acervos"),
        ("performance", "Performance"),
        ("materias", "Matérias"),
        ("classicos", "Clássicos"),
        ("oab", "OAB")
    ]

    private let fallbackLivros: [SwiftLivro] = [
        SwiftLivro(
            id: "cl-1",
            titulo: "Dos Delitos e das Penas",
            autor: "Cesare Beccaria",
            sobre: "Obra seminal que fundou os pilares modernos do Direito Penal garantista e a proporcionalidade das penas.",
            colecao: "classicos",
            area: "Direito Penal",
            paginas: 160,
            download: nil
        ),
        SwiftLivro(
            id: "cl-2",
            titulo: "O Espírito das Leis",
            autor: "Montesquieu",
            sobre: "Tratado fundamental sobre a separação dos três poderes do Estado e a teoria republicana.",
            colecao: "classicos",
            area: "Teoria do Estado",
            paginas: 480,
            download: nil
        ),
        SwiftLivro(
            id: "cl-3",
            titulo: "O Caso dos Exploradores de Cavernas",
            autor: "Lon L. Fuller",
            sobre: "Famoso dilema jurídico que explora jusnaturalismo, positivismo e moralidade no Direito.",
            colecao: "classicos",
            area: "Filosofia do Direito",
            paginas: 112,
            download: nil
        ),
        SwiftLivro(
            id: "oab-1",
            titulo: "Manual Prático de Ética e Estatuto da OAB",
            autor: "Equipe Prime",
            sobre: "Guia completo com artigos fundamentais e questões comentadas para aprovação no Exame de Ordem.",
            colecao: "oab",
            area: "Ética Profissional",
            paginas: 240,
            download: nil
        ),
        SwiftLivro(
            id: "perf-1",
            titulo: "Oratória Forense e Argumentação",
            autor: "Direito Prime",
            sobre: "Técnicas de sustentação oral, postura, clareza e persuasão jurídica para tribunais.",
            colecao: "performance",
            area: "Oratória",
            paginas: 190,
            download: nil
        ),
        SwiftLivro(
            id: "mat-1",
            titulo: "Curso de Direito Constitucional Aplicado",
            autor: "Doutrina Selecionada",
            sobre: "Direitos e garantias fundamentais, controle de constitucionalidade e organização dos poderes.",
            colecao: "materias",
            area: "Constitucional",
            paginas: 520,
            download: nil
        ),
        SwiftLivro(
            id: "mat-2",
            titulo: "Direito Civil Contemporâneo",
            autor: "Doutrina Selecionada",
            sobre: "Parte geral, contratos civis, responsabilidade civil e direitos reais.",
            colecao: "materias",
            area: "Civil",
            paginas: 610,
            download: nil
        )
    ]

    var filteredLivros: [SwiftLivro] {
        livros.filter { livro in
            let matchAba: Bool = {
                switch selectedAba {
                case "acervos": return true
                case "performance": return livro.colecao == "performance"
                case "materias": return livro.colecao == "materias"
                case "classicos": return livro.colecao == "classicos"
                case "oab": return livro.colecao == "oab"
                default: return true
                }
            }()

            let matchSearch: Bool = {
                if searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return true }
                let query = searchQuery.lowercased()
                let titleMatch = livro.titulo.lowercased().contains(query)
                let authorMatch = livro.autor?.lowercased().contains(query) ?? false
                let areaMatch = livro.area?.lowercased().contains(query) ?? false
                return titleMatch || authorMatch || areaMatch
            }()

            return matchAba && matchSearch
        }
    }

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.05).edgesIgnoringSafeArea(.all)

            VStack(spacing: 0) {
                // ── HEADER NATIVO ──
                HStack {
                    Button(action: {
                        hapticImpact.impactOccurred()
                        onClose()
                    }) {
                        Image(systemName: "arrow.left")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color(red: 0.12, green: 0.12, blue: 0.14))
                            .clipShape(Circle())
                    }

                    Spacer()

                    Text("BIBLIOTECA JURÍDICA")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .tracking(2)

                    Spacer()

                    Button(action: {
                        hapticImpact.impactOccurred()
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            isSearching.toggle()
                            if !isSearching { searchQuery = "" }
                        }
                    }) {
                        Image(systemName: isSearching ? "xmark" : "magnifyingglass")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(isSearching ? Color(red: 0.8, green: 0.1, blue: 0.1) : Color(red: 0.12, green: 0.12, blue: 0.14))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 10)

                // ── CAMPO DE BUSCA AO VIVO ──
                if isSearching {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Pesquisar livro, autor ou tema...", text: $searchQuery)
                            .foregroundColor(.white)
                            .font(.system(size: 14))
                        if !searchQuery.isEmpty {
                            Button(action: { searchQuery = "" }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                    .padding(12)
                    .background(Color(red: 0.12, green: 0.12, blue: 0.14))
                    .cornerRadius(12)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                // ── SELETOR DE ABAS / COLEÇÕES ──
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(abas, id: \.id) { aba in
                            let isSelected = selectedAba == aba.id
                            Button(action: {
                                hapticImpact.impactOccurred()
                                selectedAba = aba.id
                            }) {
                                Text(aba.label)
                                    .font(.system(size: 13, weight: isSelected ? .bold : .medium))
                                    .foregroundColor(isSelected ? Color(red: 0.1, green: 0.08, blue: 0.0) : Color(red: 0.8, green: 0.8, blue: 0.8))
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(isSelected ? Color(red: 0.96, green: 0.62, blue: 0.04) : Color(red: 0.11, green: 0.11, blue: 0.12))
                                    .cornerRadius(20)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(isSelected ? Color(red: 0.98, green: 0.75, blue: 0.14) : Color(red: 0.18, green: 0.18, blue: 0.19), lineWidth: 1)
                                    )
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                }

                // ── LISTA DE LIVROS (120FPS LAZYVSTACK) ──
                if filteredLivros.isEmpty {
                    Spacer()
                    Text(searchQuery.isEmpty ? "Nenhum livro disponível nesta seção." : "Nenhuma obra encontrada para \"\(searchQuery)\"")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(32)
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(filteredLivros) { livro in
                                Button(action: {
                                    hapticImpact.impactOccurred()
                                    selectedLivro = livro
                                }) {
                                    HStack(spacing: 12) {
                                        // Mini Capa / Ícone
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 8)
                                                .fill(
                                                    LinearGradient(
                                                        colors: [Color(red: 0.2, green: 0.2, blue: 0.22), Color(red: 0.12, green: 0.12, blue: 0.14)],
                                                        startPoint: .top,
                                                        endPoint: .bottom
                                                    )
                                                )
                                                .frame(width: 54, height: 74)
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 8)
                                                        .stroke(Color(red: 0.25, green: 0.25, blue: 0.28), lineWidth: 1)
                                                )

                                            Image(systemName: "book.fill")
                                                .font(.system(size: 22))
                                                .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                                        }

                                        // Informações
                                        VStack(alignment: .leading, spacing: 4) {
                                            if let area = livro.area, !area.isEmpty {
                                                Text(area.uppercased())
                                                    .font(.system(size: 10, weight: .bold))
                                                    .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                                                    .tracking(1)
                                            }

                                            Text(livro.titulo)
                                                .font(.system(size: 15, weight: .bold))
                                                .foregroundColor(.white)
                                                .lineLimit(2)
                                                .multilineTextAlignment(.leading)

                                            if let autor = livro.autor, !autor.isEmpty {
                                                Text(autor)
                                                    .font(.system(size: 12))
                                                    .foregroundColor(Color(red: 0.65, green: 0.65, blue: 0.65))
                                                    .lineLimit(1)
                                            }
                                        }

                                        Spacer()

                                        // Tag Páginas / Ação
                                        VStack(alignment: .trailing, spacing: 4) {
                                            if let paginas = livro.paginas, paginas > 0 {
                                                Text("\(paginas) págs")
                                                    .font(.system(size: 11))
                                                    .foregroundColor(Color(red: 0.45, green: 0.45, blue: 0.45))
                                            }

                                            Text("Ler")
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundColor(Color(red: 0.98, green: 0.75, blue: 0.14))
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 4)
                                                .background(Color(red: 0.14, green: 0.14, blue: 0.16))
                                                .cornerRadius(12)
                                        }
                                    }
                                    .padding(12)
                                    .background(Color(red: 0.09, green: 0.09, blue: 0.10))
                                    .cornerRadius(16)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color(red: 0.15, green: 0.15, blue: 0.17), lineWidth: 1)
                                    )
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                        .padding(.bottom, 32)
                    }
                }
            }
        }
        .onAppear {
            livros = fallbackLivros
            selectedAba = initialAba.isEmpty ? "acervos" : initialAba
            fetchLivros()
        }
        .sheet(item: $selectedLivro) { livro in
            SwiftLivroDetailSheet(livro: livro, onDismiss: { selectedLivro = nil })
        }
    }

    private func fetchLivros() {
        guard let url = URL(string: "https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/biblioteca_classicos?select=id,livro,autor,sobre,download&limit=40") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0", forHTTPHeaderField: "apikey")
        if !accessToken.isEmpty {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.dataTask(with: request) { data, _, _ in
            guard let data = data else { return }
            do {
                if let jsonArray = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                    let parsed: [SwiftLivro] = jsonArray.compactMap { obj in
                        guard let id = obj["id"] as? String ?? (obj["id"] as? Int).map(String.init),
                              let titulo = obj["livro"] as? String else { return nil }
                        return SwiftLivro(
                            id: id,
                            titulo: titulo,
                            autor: obj["autor"] as? String ?? "Autor Clássico",
                            sobre: obj["sobre"] as? String ?? "",
                            colecao: "classicos",
                            area: "Clássicos do Direito",
                            paginas: 250,
                            download: obj["download"] as? String
                        )
                    }

                    DispatchQueue.main.async {
                        if !parsed.isEmpty {
                            self.livros = parsed + self.fallbackLivros.filter { $0.colecao != "classicos" }
                        }
                        self.isLoading = false
                    }
                }
            } catch {
                DispatchQueue.main.async { self.isLoading = false }
            }
        }.resume()
    }
}

struct SwiftLivroDetailSheet: View {
    let livro: SwiftLivro
    let onDismiss: () -> Void

    var body: some View {
        ZStack {
            Color(red: 0.08, green: 0.08, blue: 0.09).edgesIgnoringSafeArea(.all)

            VStack(alignment: .leading, spacing: 16) {
                // Barra de puxar
                HStack {
                    Spacer()
                    Capsule()
                        .fill(Color(red: 0.25, green: 0.25, blue: 0.25))
                        .frame(width: 40, height: 4)
                    Spacer()
                }
                .padding(.top, 12)

                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        if let area = livro.area, !area.isEmpty {
                            Text(area.uppercased())
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                                .tracking(1)
                        }

                        Text(livro.titulo)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)

                        if let autor = livro.autor, !autor.isEmpty {
                            Text("Por \(autor)")
                                .font(.system(size: 13))
                                .foregroundColor(Color(red: 0.7, green: 0.7, blue: 0.7))
                        }
                    }

                    Spacer()

                    Button(action: onDismiss) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 32, height: 32)
                            .background(Color(red: 0.16, green: 0.16, blue: 0.18))
                            .clipShape(Circle())
                    }
                }

                Divider()
                    .background(Color(red: 0.18, green: 0.18, blue: 0.2))

                ScrollView {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("SOBRE A OBRA")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(red: 0.5, green: 0.5, blue: 0.5))
                            .tracking(1)

                        Text((livro.sobre?.isEmpty ?? true) ? "Obra integrante do acervo permanente da Biblioteca Jurídica Direito Prime." : livro.sobre!)
                            .font(.system(size: 14))
                            .foregroundColor(Color(red: 0.85, green: 0.85, blue: 0.85))
                            .lineSpacing(4)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                Spacer()

                Button(action: onDismiss) {
                    Text("FECHAR DETALHES")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(red: 0.08, green: 0.08, blue: 0.09))
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color(red: 0.96, green: 0.62, blue: 0.04))
                        .cornerRadius(14)
                }
            }
            .padding(20)
        }
    }
}
