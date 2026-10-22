import SwiftUI

// --- Models ---
struct NativeSubtema: Identifiable, Codable, Equatable {
    let id: String
    let subtema: String
    let ordem: Int
    var markdown: String?
    var exemplos: String?
    var termos: String?
}

struct NativeTema: Identifiable, Codable, Equatable {
    var id: String { tema }
    let tema: String
    let total: Int
    let subtemas: [NativeSubtema]
}

struct NativeArea: Identifiable, Codable, Equatable {
    var id: String { area }
    let area: String
    let total: Int
    let coverUrl: String
    let temas: [NativeTema]
}

struct ResumoContent: Codable {
    let id: String
    let markdown: String
    let exemplos: String
    let termos: String
}

// --- Repository for Async Resumo Fetching & Caching ---
class ResumosRepository {
    static let shared = ResumosRepository()
    private var cache: [String: ResumoContent] = [:]
    
    func fetchContent(id: String) async -> ResumoContent? {
        if let cached = cache[id] { return cached }
        guard let url = URL(string: "https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/resumos_juridicos?select=id,markdown,exemplos,termos&id=eq.\(id)") else { return nil }
        
        var req = URLRequest(url: url)
        req.setValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0", forHTTPHeaderField: "apikey")
        req.setValue("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            if let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]], let first = arr.first {
                let content = ResumoContent(
                    id: first["id"] as? String ?? id,
                    markdown: first["markdown"] as? String ?? "",
                    exemplos: first["exemplos"] as? String ?? "",
                    termos: first["termos"] as? String ?? ""
                )
                cache[id] = content
                return content
            }
        } catch { }
        return nil
    }
}

// --- Cover Image View (64x88pt) ---
struct CoverImageView: View {
    let urlString: String
    
    var body: some View {
        Group {
            if let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ZStack {
                            Color(red: 26/255, green: 26/255, blue: 26/255)
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.7)
                        }
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        ZStack {
                            Color(red: 26/255, green: 26/255, blue: 26/255)
                            Image(systemName: "book.closed.fill")
                                .foregroundColor(.gray.opacity(0.5))
                                .font(.system(size: 20))
                        }
                    @unknown default:
                        Color(red: 26/255, green: 26/255, blue: 26/255)
                    }
                }
            } else {
                Color(red: 26/255, green: 26/255, blue: 26/255)
            }
        }
        .frame(width: 64, height: 88)
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.white.opacity(0.12), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.3), radius: 3, x: 0, y: 2)
    }
}

// --- Main Native View ---
struct ResumosView: View {
    var initialArea: String?
    var initialTema: String?
    var payload: String?
    var isReader: Bool
    var onBack: () -> Void
    
    // UI Colors
    let darkBg = Color(red: 13/255, green: 13/255, blue: 13/255)
    let cardBg = Color(red: 22/255, green: 22/255, blue: 22/255)
    let accentRed = Color(red: 239/255, green: 68/255, blue: 68/255)
    
    @State private var catalog: [NativeArea] = []
    @State private var selectedArea: NativeArea?
    @State private var selectedTema: NativeTema?
    @State private var selectedSubtema: NativeSubtema?
    
    @State private var searchQuery: String = ""
    @State private var readerTab: String = "resumo" // "resumo", "exemplos", "termos"
    @State private var readerContent: ResumoContent?
    @State private var isLoadingContent: Bool = false
    
    var currentTitle: String {
        if let sub = selectedSubtema { return sub.subtema }
        if let tema = selectedTema { return tema.tema }
        if let area = selectedArea { return area.area }
        return "Resumos Jurídicos"
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                darkBg.edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 0) {
                    // LEVEL 4: LEITOR DO RESUMO
                    if let subtema = selectedSubtema {
                        VStack(spacing: 16) {
                            // Selector de Métodos / Abas
                            HStack {
                                ForEach([("resumo", "Resumo"), ("exemplos", "Exemplos"), ("termos", "Termos")], id: \.0) { tabId, label in
                                    let active = readerTab == tabId
                                    Button(action: {
                                        readerTab = tabId
                                    }) {
                                        Text(label)
                                            .font(.system(size: 13, weight: active ? .bold : .medium))
                                            .foregroundColor(active ? .white : .gray)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 8)
                                            .background(active ? accentRed : Color.clear)
                                            .cornerRadius(20)
                                    }
                                }
                            }
                            .padding(4)
                            .background(Color(red: 30/255, green: 30/255, blue: 30/255))
                            .cornerRadius(24)
                            .padding(.horizontal, 16)
                            .padding(.top, 8)
                            
                            if isLoadingContent {
                                Spacer()
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: accentRed))
                                    .scaleEffect(1.2)
                                Text("Carregando resumo...")
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                                    .padding(.top, 8)
                                Spacer()
                            } else {
                                ScrollView {
                                    VStack(alignment: .leading, spacing: 16) {
                                        if readerTab == "resumo" {
                                            let text = readerContent?.markdown.isEmpty == false ? readerContent!.markdown : "Conteúdo do resumo ainda não cadastrado."
                                            Text(text)
                                                .font(.system(size: 16))
                                                .foregroundColor(Color(red: 240/255, green: 240/255, blue: 240/255))
                                                .lineSpacing(6)
                                        } else if readerTab == "exemplos" {
                                            let text = readerContent?.exemplos.isEmpty == false ? readerContent!.exemplos : "Nenhum exemplo prático registrado para este tema."
                                            VStack(alignment: .leading, spacing: 12) {
                                                Text("Casos Práticos & Exemplos")
                                                    .font(.headline)
                                                    .foregroundColor(.white)
                                                Text(text)
                                                    .font(.system(size: 15))
                                                    .foregroundColor(Color(red: 200/255, green: 200/255, blue: 200/255))
                                                    .lineSpacing(5)
                                            }
                                            .padding(16)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                            .background(cardBg)
                                            .cornerRadius(12)
                                        } else {
                                            let text = readerContent?.termos.isEmpty == false ? readerContent!.termos : "Nenhum vocabulário jurídico específico listado."
                                            VStack(alignment: .leading, spacing: 12) {
                                                Text("Vocabulário & Termos Técnicos")
                                                    .font(.headline)
                                                    .foregroundColor(.white)
                                                Text(text)
                                                    .font(.system(size: 15))
                                                    .foregroundColor(Color(red: 200/255, green: 200/255, blue: 200/255))
                                                    .lineSpacing(5)
                                            }
                                            .padding(16)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                            .background(cardBg)
                                            .cornerRadius(12)
                                        }
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.bottom, 32)
                                }
                            }
                        }
                    }
                    
                    // LEVEL 3: LISTA DE SUBTEMAS DO TEMA SELECIONADO
                    else if let tema = selectedTema {
                        let filteredSubtemas = tema.subtemas.filter {
                            searchQuery.isEmpty || $0.subtema.localizedCaseInsensitiveContains(searchQuery)
                        }
                        
                        VStack(spacing: 0) {
                            searchBarView(placeholder: "Buscar resumo...")
                            
                            ScrollView {
                                LazyVStack(spacing: 10) {
                                    ForEach(filteredSubtemas) { subtema in
                                        Button(action: {
                                            selectedSubtema = subtema
                                            loadSubtemaContent(subtema)
                                        }) {
                                            HStack(spacing: 14) {
                                                ZStack {
                                                    Circle()
                                                        .fill(Color(red: 36/255, green: 36/255, blue: 36/255))
                                                        .frame(width: 36, height: 36)
                                                    Text("\(subtema.ordem)")
                                                        .font(.system(size: 13, weight: .bold))
                                                        .foregroundColor(accentRed)
                                                }
                                                
                                                VStack(alignment: .leading, spacing: 3) {
                                                    Text(subtema.subtema)
                                                        .font(.system(size: 15, weight: .semibold))
                                                        .foregroundColor(.white)
                                                        .multilineTextAlignment(.leading)
                                                    
                                                    Text("Toque para ler o resumo")
                                                        .font(.system(size: 12))
                                                        .foregroundColor(.gray)
                                                }
                                                
                                                Spacer()
                                                
                                                Image(systemName: "chevron.right")
                                                    .font(.system(size: 13, weight: .bold))
                                                    .foregroundColor(.gray.opacity(0.6))
                                            }
                                            .padding(14)
                                            .background(cardBg)
                                            .cornerRadius(14)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 14)
                                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                            )
                                        }
                                    }
                                }
                                .padding(16)
                            }
                        }
                    }
                    
                    // LEVEL 2: LISTA DE TEMAS DA ÁREA SELECIONADA
                    else if let area = selectedArea {
                        let filteredTemas = area.temas.filter {
                            searchQuery.isEmpty || $0.tema.localizedCaseInsensitiveContains(searchQuery)
                        }
                        
                        VStack(spacing: 0) {
                            searchBarView(placeholder: "Buscar matéria...")
                            
                            ScrollView {
                                LazyVStack(spacing: 12) {
                                    ForEach(filteredTemas) { tema in
                                        Button(action: {
                                            searchQuery = ""
                                            selectedTema = tema
                                        }) {
                                            HStack(spacing: 14) {
                                                CoverImageView(urlString: area.coverUrl)
                                                
                                                VStack(alignment: .leading, spacing: 4) {
                                                    Text(tema.tema)
                                                        .font(.system(size: 16, weight: .bold))
                                                        .foregroundColor(.white)
                                                        .multilineTextAlignment(.leading)
                                                        .lineLimit(2)
                                                    
                                                    Text("\(tema.total) resumos")
                                                        .font(.system(size: 13))
                                                        .foregroundColor(.gray)
                                                }
                                                
                                                Spacer()
                                                
                                                Image(systemName: "chevron.right")
                                                    .font(.system(size: 14, weight: .semibold))
                                                    .foregroundColor(.gray.opacity(0.6))
                                            }
                                            .padding(12)
                                            .background(cardBg)
                                            .cornerRadius(16)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 16)
                                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                            )
                                        }
                                    }
                                }
                                .padding(16)
                            }
                        }
                    }
                    
                    // LEVEL 1: LISTA PRINCIPAL DE ÁREAS DO DIREITO
                    else {
                        let filteredAreas = catalog.filter {
                            searchQuery.isEmpty || $0.area.localizedCaseInsensitiveContains(searchQuery)
                        }
                        
                        VStack(spacing: 0) {
                            searchBarView(placeholder: "Pesquisar área do direito...")
                            
                            if filteredAreas.isEmpty {
                                Spacer()
                                Text(searchQuery.isEmpty ? "Carregando matérias..." : "Nenhuma área encontrada")
                                    .font(.system(size: 15))
                                    .foregroundColor(.gray)
                                Spacer()
                            } else {
                                ScrollView {
                                    LazyVStack(spacing: 12) {
                                        ForEach(filteredAreas) { area in
                                            let displayArea = area.area.replacingOccurrences(
                                                of: "(?i)^DIREITO\\s+(DO\\s+|DA\\s+|DE\\s+)?",
                                                with: "",
                                                options: .regularExpression
                                            )
                                            
                                            Button(action: {
                                                searchQuery = ""
                                                selectedArea = area
                                            }) {
                                                HStack(spacing: 14) {
                                                    CoverImageView(urlString: area.coverUrl)
                                                    
                                                    VStack(alignment: .leading, spacing: 4) {
                                                        Text(displayArea)
                                                            .font(.system(size: 16, weight: .bold))
                                                            .foregroundColor(.white)
                                                            .multilineTextAlignment(.leading)
                                                            .lineLimit(2)
                                                        
                                                        Text("\(area.total) resumos • \(area.temas.count) matérias")
                                                            .font(.system(size: 13))
                                                            .foregroundColor(.gray)
                                                    }
                                                    
                                                    Spacer()
                                                    
                                                    Image(systemName: "chevron.right")
                                                        .font(.system(size: 14, weight: .semibold))
                                                        .foregroundColor(.gray.opacity(0.6))
                                                }
                                                .padding(12)
                                                .background(cardBg)
                                                .cornerRadius(16)
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 16)
                                                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                                )
                                            }
                                        }
                                    }
                                    .padding(16)
                                }
                            }
                        }
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text(currentTitle)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: handleBackNavigation) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
            }
        }
        .onAppear {
            parsePayloadAndInitialize()
            configureNavigationBar()
        }
    }
    
    // --- Helper Views ---
    private func searchBarView(placeholder: String) -> some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField(placeholder, text: $searchQuery)
                .foregroundColor(.white)
                .font(.system(size: 14))
            
            if !searchQuery.isEmpty {
                Button(action: { searchQuery = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color(red: 20/255, green: 20/255, blue: 20/255))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
    
    // --- Navigation Logic ---
    private func handleBackNavigation() {
        if selectedSubtema != nil {
            selectedSubtema = nil
        } else if selectedTema != nil {
            selectedTema = nil
        } else if selectedArea != nil {
            selectedArea = nil
        } else {
            onBack()
        }
    }
    
    // --- Data Parsing & Init ---
    private func parsePayloadAndInitialize() {
        guard let payload = payload, !payload.isEmpty, let data = payload.data(using: .utf8) else {
            return
        }
        
        do {
            let parsed = try JSONDecoder().decode([NativeArea].self, data)
            self.catalog = parsed
            
            if let initArea = initialArea {
                if let foundArea = parsed.first(where: { $0.area.localizedCaseInsensitiveCompare(initArea) == .orderedSame }) {
                    self.selectedArea = foundArea
                    
                    if let initTema = initialTema {
                        if let foundTema = foundArea.temas.first(where: { $0.tema.localizedCaseInsensitiveCompare(initTema) == .orderedSame }) {
                            self.selectedTema = foundTema
                            
                            if isReader, let firstSub = foundTema.subtemas.first {
                                self.selectedSubtema = firstSub
                                loadSubtemaContent(firstSub)
                            }
                        }
                    }
                }
            }
        } catch {
            print("Failed to decode catalog payload: \(error)")
        }
    }
    
    private func loadSubtemaContent(_ subtema: NativeSubtema) {
        if let md = subtema.markdown, !md.isEmpty {
            self.readerContent = ResumoContent(
                id: subtema.id,
                markdown: md,
                exemplos: subtema.exemplos ?? "",
                termos: subtema.termos ?? ""
            )
        } else {
            self.isLoadingContent = true
            Task {
                let content = await ResumosRepository.shared.fetchContent(id: subtema.id)
                await MainActor.run {
                    self.readerContent = content
                    self.isLoadingContent = false
                }
            }
        }
    }
    
    private func configureNavigationBar() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(red: 13/255, green: 13/255, blue: 13/255, alpha: 1)
        appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
    }
}
