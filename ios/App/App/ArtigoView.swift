import SwiftUI
import AVFoundation

public struct ArtigoData {
    public let id: String
    public let numero: String
    public let caput: String
    public let titulo: String
    public let tabelaNome: String
    public let paragrafos: [String]
    public let incisos: [String]
    public let audioUrl: String
    public let initialHighlights: [String] // "lineIndex:wordIndex:colorHex"
    
    public init(
        id: String,
        numero: String,
        caput: String,
        titulo: String,
        tabelaNome: String,
        paragrafos: [String],
        incisos: [String],
        audioUrl: String,
        initialHighlights: [String] = []
    ) {
        self.id = id
        self.numero = numero
        self.caput = caput
        self.titulo = titulo
        self.tabelaNome = tabelaNome
        self.paragrafos = paragrafos
        self.incisos = incisos
        self.audioUrl = audioUrl
        self.initialHighlights = initialHighlights
    }
}

// Modelo de Jurisprudência Nativa
struct JurisprudenciaItem: Identifiable {
    let id = UUID()
    let tribunal: String // STF, STJ, TST
    let tipo: String // Súmula Vinculante, Súmula, Tema RG, Repetitivo
    let numero: String
    let tese: String
    let ano: String
}

// Modelo de Nota de Voz Nativa
struct VoiceNoteItem: Identifiable {
    let id: String
    let url: URL
    let date: Date
    let durationSeconds: Int
}

public struct ArtigoView: View {
    public let artigo: ArtigoData
    public var onClose: () -> Void
    public var onHighlightsChanged: (([String]) -> Void)?
    
    @State private var selectedTab = 0 // 0: Artigo, 1: Jurisprudência, 2: Anotações & Voz
    @State private var fontSize: CGFloat = 17
    @State private var highlightMode = false
    @State private var selectedColor = "#FACC15"
    @State private var highlights: [String: String] = [:]
    
    // Áudio e Narração
    @State private var isPlayingNarration = false
    @State private var narrationPlayer: AVPlayer?
    @State private var speechSynthesizer = AVSpeechSynthesizer()
    
    // Anotações em Texto
    @State private var userTextNote: String = ""
    
    // Gravador de Voz Nativo (AVAudioRecorder)
    @State private var isRecording = false
    @State private var audioRecorder: AVAudioRecorder?
    @State private var voiceNotes: [VoiceNoteItem] = []
    @State private var activePlayingVoiceNoteId: String?
    @State private var voicePlayer: AVAudioPlayer?
    @State private var recordDuration: Int = 0
    @State private var recordTimer: Timer?
    
    private let highlightColors = [
        ("#FACC15", "Amarelo"),
        ("#4ADE80", "Verde"),
        ("#60A5FA", "Azul"),
        ("#F472B6", "Rosa"),
        ("#FB923C", "Laranja")
    ]
    
    public init(
        artigo: ArtigoData,
        onClose: @escaping () -> Void,
        onHighlightsChanged: (([String]) -> Void)? = nil
    ) {
        self.artigo = artigo
        self.onClose = onClose
        self.onHighlightsChanged = onHighlightsChanged
    }
    
    public var body: some View {
        ZStack {
            Color(hex: 0x0D0D0D)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header Superior
                headerView
                
                // Segmented Tab Bar Nativa
                tabSelector
                
                // Conteúdo Principal conforme a Aba Ativa
                TabView(selection: $selectedTab) {
                    // Aba 0: Leitor de Artigo
                    artigoContentView
                        .tag(0)
                    
                    // Aba 1: Jurisprudência Vinculada
                    jurisprudenciaContentView
                        .tag(1)
                    
                    // Aba 2: Minhas Anotações & Gravador de Voz
                    anotacoesContentView
                        .tag(2)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                
                // Barra de Ações Inferior (Somente na aba do Artigo)
                if selectedTab == 0 {
                    bottomActionBar
                }
            }
        }
        .onAppear {
            setupInitialHighlights()
            loadSavedNotes()
            loadVoiceNotes()
        }
        .onDisappear {
            stopNarration()
            stopVoicePlayer()
            stopRecording()
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        HStack(spacing: 14) {
            Button(action: {
                haptic()
                stopNarration()
                onClose()
            }) {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 38, height: 38)
                    .background(Color.white.opacity(0.08))
                    .clipShape(Circle())
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text("Art. \(artigo.numero)")
                    .font(.system(size: 17, weight: .black))
                    .foregroundColor(.white)
                
                if !artigo.tabelaNome.isEmpty {
                    Text(artigo.tabelaNome.replacingOccurrences(of: "_", with: " ").uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(hex: 0xE11D48))
                        .tracking(1)
                }
            }
            
            Spacer()
            
            if selectedTab == 0 {
                // Controles de Fonte
                HStack(spacing: 6) {
                    Button(action: {
                        haptic()
                        if fontSize > 13 { fontSize -= 2 }
                    }) {
                        Text("A-")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 32, height: 32)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(8)
                    }
                    
                    Button(action: {
                        haptic()
                        if fontSize < 26 { fontSize += 2 }
                    }) {
                        Text("A+")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 32, height: 32)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
        .background(Color(hex: 0x141416))
    }
    
    // MARK: - Seletor de Abas Nativo
    private var tabSelector: some View {
        HStack(spacing: 8) {
            tabButton(title: "Artigo", icon: "doc.text.fill", index: 0)
            tabButton(title: "Jurisprudência", icon: "scale.3d", index: 1)
            tabButton(title: "Anotações & Voz", icon: "mic.fill", index: 2)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(hex: 0x141416).opacity(0.95))
    }
    
    private func tabButton(title: String, icon: String, index: Int) -> some View {
        let isSelected = selectedTab == index
        return Button(action: {
            haptic()
            withAnimation(.easeInOut(duration: 0.2)) {
                selectedTab = index
            }
        }) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .semibold))
                Text(title)
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundColor(isSelected ? .white : Color(hex: 0x9CA3AF))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(isSelected ? Color(hex: 0xE11D48) : Color.white.opacity(0.05))
            )
        }
    }
    
    // MARK: - Aba 0: Artigo
    private var artigoContentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if !artigo.titulo.isEmpty {
                    Text(artigo.titulo)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color(hex: 0x9CA3AF))
                }
                
                Divider()
                    .background(Color.white.opacity(0.1))
                
                // Caput
                renderTextParagraph(text: artigo.caput, lineIndex: 0)
                
                // Parágrafos
                ForEach(Array(artigo.paragrafos.enumerated()), id: \.offset) { idx, para in
                    renderTextParagraph(text: para, lineIndex: idx + 1)
                }
                
                // Incisos
                ForEach(Array(artigo.incisos.enumerated()), id: \.offset) { idx, inc in
                    renderTextParagraph(text: inc, lineIndex: artigo.paragrafos.count + idx + 1)
                }
                
                Spacer(minLength: 120)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
        }
    }
    
    // MARK: - Aba 1: Jurisprudência Nativa
    private var jurisprudenciaContentView: some View {
        let jurisprudencias = getMockJurisprudencias()
        return ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("PRECEDENTES & SÚMULAS")
                    .font(.system(size: 11, weight: .black))
                    .foregroundColor(Color(hex: 0xE11D48))
                    .tracking(1.5)
                    .padding(.top, 8)
                
                Text("Jurisprudência selecionada e teses vinculadas ao Art. \(artigo.numero)")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(Color(hex: 0x9CA3AF))
                
                ForEach(jurisprudencias) { item in
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text(item.tribunal)
                                .font(.system(size: 11, weight: .black))
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(item.tribunal == "STF" ? Color(hex: 0x2563EB) : Color(hex: 0x059669))
                                .cornerRadius(6)
                            
                            Text(item.tipo)
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(Color(hex: 0x9CA3AF))
                            
                            Spacer()
                            
                            Text(item.ano)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(Color(hex: 0x6B7280))
                        }
                        
                        Text(item.tese)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Color(hex: 0xE5E7EB))
                            .lineSpacing(4)
                        
                        HStack {
                            Spacer()
                            Button(action: {
                                haptic()
                                UIPasteboard.general.string = "\(item.tribunal) - \(item.tipo) \(item.numero): \(item.tese)"
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "doc.on.doc")
                                        .font(.system(size: 11))
                                    Text("Copiar Citação")
                                        .font(.system(size: 11, weight: .bold))
                                }
                                .foregroundColor(Color(hex: 0x60A5FA))
                            }
                        }
                    }
                    .padding(14)
                    .background(Color(hex: 0x18181B))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                    )
                }
                
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
        }
    }
    
    // MARK: - Aba 2: Minhas Anotações & Gravador de Voz
    private var anotacoesContentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Bloco de Anotações em Texto
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("ANOTAÇÃO EM TEXTO")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(Color(hex: 0xE11D48))
                            .tracking(1.5)
                        
                        Spacer()
                        
                        Text("Salvo automaticamente")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(Color(hex: 0x6B7280))
                    }
                    
                    TextEditor(text: $userTextNote)
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                        .frame(minHeight: 120)
                        .padding(10)
                        .background(Color(hex: 0x18181B))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .onChange(of: userTextNote) { newValue in
                            saveTextNote(newValue)
                        }
                }
                
                Divider()
                    .background(Color.white.opacity(0.1))
                
                // Gravador Nativo de Voz
                VStack(alignment: .leading, spacing: 12) {
                    Text("GRAVAÇÕES DE VOZ NATIVAS")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(Color(hex: 0xE11D48))
                        .tracking(1.5)
                    
                    // Card Gravador
                    HStack(spacing: 16) {
                        Button(action: {
                            haptic()
                            if isRecording {
                                stopRecording()
                            } else {
                                startRecording()
                            }
                        }) {
                            ZStack {
                                Circle()
                                    .fill(isRecording ? Color(hex: 0xDC2626) : Color(hex: 0xE11D48))
                                    .frame(width: 54, height: 54)
                                    .shadow(color: Color(hex: 0xE11D48).opacity(isRecording ? 0.6 : 0.3), radius: 8)
                                
                                Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(isRecording ? "Gravando anotação..." : "Gravar nota de voz")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text(isRecording ? formatDuration(recordDuration) : "Toque para gravar suas considerações")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(isRecording ? Color(hex: 0xEF4444) : Color(hex: 0x9CA3AF))
                        }
                        
                        Spacer()
                    }
                    .padding(14)
                    .background(Color(hex: 0x18181B))
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(isRecording ? Color(hex: 0xEF4444).opacity(0.5) : Color.white.opacity(0.06), lineWidth: 1)
                    )
                    
                    // Lista de Áudios Gravados
                    if voiceNotes.isEmpty {
                        Text("Nenhuma gravação de áudio salva ainda.")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: 0x6B7280))
                            .padding(.top, 6)
                    } else {
                        VStack(spacing: 10) {
                            ForEach(voiceNotes) { item in
                                HStack(spacing: 12) {
                                    Button(action: {
                                        haptic()
                                        togglePlayVoiceNote(item)
                                    }) {
                                        Image(systemName: activePlayingVoiceNoteId == item.id ? "pause.circle.fill" : "play.circle.fill")
                                            .font(.system(size: 32))
                                            .foregroundColor(Color(hex: 0x38BDF8))
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Anotação de Voz")
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(.white)
                                        
                                        Text(formatDate(item.date))
                                            .font(.system(size: 11))
                                            .foregroundColor(Color(hex: 0x9CA3AF))
                                    }
                                    
                                    Spacer()
                                    
                                    Button(action: {
                                        haptic()
                                        deleteVoiceNote(item)
                                    }) {
                                        Image(systemName: "trash")
                                            .font(.system(size: 15))
                                            .foregroundColor(Color(hex: 0xF87171))
                                            .padding(8)
                                    }
                                }
                                .padding(12)
                                .background(Color(hex: 0x18181B))
                                .cornerRadius(10)
                            }
                        }
                    }
                }
                
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
        }
    }
    
    // MARK: - Barra Inferior
    private var bottomActionBar: some View {
        HStack(spacing: 20) {
            Button(action: {
                haptic()
                highlights.removeAll()
                onHighlightsChanged?([])
            }) {
                VStack(spacing: 3) {
                    Image(systemName: "trash")
                        .font(.system(size: 18))
                        .foregroundColor(Color(hex: 0xF87171))
                    Text("Limpar")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(hex: 0xF87171))
                }
            }
            .frame(width: 50)
            
            Spacer()
            
            Button(action: {
                haptic()
                toggleNarration()
            }) {
                ZStack {
                    Circle()
                        .fill(Color(hex: 0xE11D48))
                        .frame(width: 58, height: 58)
                        .shadow(color: Color(hex: 0xE11D48).opacity(0.4), radius: 10, y: 4)
                    
                    Image(systemName: isPlayingNarration ? "pause.fill" : "play.fill")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .offset(y: -12)
            
            Spacer()
            
            // Paleta de Cores
            HStack(spacing: 7) {
                ForEach(highlightColors, id: \.0) { hex, _ in
                    Circle()
                        .fill(Color(hex: hex))
                        .frame(width: selectedColor == hex ? 22 : 16, height: selectedColor == hex ? 22 : 16)
                        .overlay(
                            Circle()
                                .stroke(Color.white, lineWidth: selectedColor == hex ? 2 : 0)
                        )
                        .onTapGesture {
                            haptic()
                            selectedColor = hex
                            highlightMode = true
                        }
                }
            }
            .frame(width: 130)
        }
        .padding(.horizontal, 22)
        .padding(.top, 8)
        .padding(.bottom, 22)
        .background(Color(hex: 0x141416))
    }
    
    // MARK: - Renderizador de Parágrafo
    private func renderTextParagraph(text: String, lineIndex: Int) -> some View {
        let words = text.components(separatedBy: " ")
        return VStack(alignment: .leading, spacing: 4) {
            Text(words.enumerated().map { wordIdx, word in
                let key = "\(lineIndex):\(wordIdx)"
                let isHighlighted = highlights[key] != nil
                return (word, isHighlighted, highlights[key])
            }.reduce(into: AttributedString()) { result, item in
                var wordAttr = AttributedString(item.0 + " ")
                wordAttr.font = .system(size: fontSize, weight: .regular)
                wordAttr.foregroundColor = Color(hex: 0xE5E7EB)
                if item.1, let hex = item.2 {
                    wordAttr.backgroundColor = Color(hex: hex).opacity(0.55)
                    wordAttr.foregroundColor = .white
                }
                result.append(wordAttr)
            })
            .lineSpacing(6)
            .contentShape(Rectangle())
            .onTapGesture {
                if highlightMode {
                    haptic()
                    toggleParagraphHighlight(lineIndex: lineIndex, totalWords: words.count)
                }
            }
        }
    }
    
    private func toggleParagraphHighlight(lineIndex: Int, totalWords: Int) {
        let sampleKey = "\(lineIndex):0"
        let alreadyHighlighted = highlights[sampleKey] != nil
        
        for w in 0..<totalWords {
            let key = "\(lineIndex):\(w)"
            if alreadyHighlighted {
                highlights.removeValue(forKey: key)
            } else {
                highlights[key] = selectedColor
            }
        }
        let serialized = highlights.map { "\($0.key):\($0.value)" }
        onHighlightsChanged?(serialized)
    }
    
    private func setupInitialHighlights() {
        for item in artigo.initialHighlights {
            let parts = item.components(separatedBy: ":")
            if parts.count >= 3 {
                highlights["\(parts[0]):\(parts[1])"] = parts[2]
            }
        }
    }
    
    // MARK: - Narração do Artigo
    private func toggleNarration() {
        if isPlayingNarration {
            stopNarration()
        } else {
            playNarration()
        }
    }
    
    private func playNarration() {
        stopNarration()
        if !artigo.audioUrl.isEmpty, let url = URL(string: artigo.audioUrl) {
            let playerItem = AVPlayerItem(url: url)
            narrationPlayer = AVPlayer(playerItem: playerItem)
            narrationPlayer?.play()
            isPlayingNarration = true
            return
        }
        
        let fullText = "\(artigo.caput). " + artigo.paragrafos.joined(separator: ". ")
        let utterance = AVSpeechUtterance(string: fullText)
        utterance.voice = AVSpeechSynthesisVoice(language: "pt-BR")
        utterance.rate = 0.52
        speechSynthesizer.speak(utterance)
        isPlayingNarration = true
    }
    
    private func stopNarration() {
        narrationPlayer?.pause()
        narrationPlayer = nil
        if speechSynthesizer.isSpeaking {
            speechSynthesizer.stopSpeaking(at: .immediate)
        }
        isPlayingNarration = false
    }
    
    // MARK: - Gravador de Voz (AVAudioRecorder)
    private func startRecording() {
        stopVoicePlayer()
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
            try audioSession.setActive(true)
            
            let fileManager = FileManager.default
            let urls = fileManager.urls(for: .documentDirectory, in: .userDomainMask)
            let noteId = UUID().uuidString
            let fileURL = urls[0].appendingPathComponent("note_\(artigo.id)_\(noteId).m4a")
            
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                AVSampleRateKey: 44100.0,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
            ]
            
            audioRecorder = try AVAudioRecorder(url: fileURL, settings: settings)
            audioRecorder?.record()
            isRecording = true
            recordDuration = 0
            
            recordTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
                recordDuration += 1
            }
        } catch {
            print("Erro ao iniciar gravador nativo:", error)
        }
    }
    
    private func stopRecording() {
        if isRecording {
            audioRecorder?.stop()
            audioRecorder = nil
            isRecording = false
            recordTimer?.invalidate()
            recordTimer = nil
            loadVoiceNotes()
        }
    }
    
    private func loadVoiceNotes() {
        let fileManager = FileManager.default
        let urls = fileManager.urls(for: .documentDirectory, in: .userDomainMask)
        guard let files = try? fileManager.contentsOfDirectory(at: urls[0], includingPropertiesForKeys: [.creationDateKey]) else { return }
        
        let prefix = "note_\(artigo.id)_"
        var items: [VoiceNoteItem] = []
        for file in files where file.lastPathComponent.hasPrefix(prefix) {
            let noteId = file.lastPathComponent.replacingOccurrences(of: prefix, with: "").replacingOccurrences(of: ".m4a", with: "")
            let attrs = try? fileManager.attributesOfItem(atPath: file.path)
            let date = attrs?[.creationDate] as? Date ?? Date()
            items.append(VoiceNoteItem(id: noteId, url: file, date: date, durationSeconds: 0))
        }
        voiceNotes = items.sorted { $0.date > $1.date }
    }
    
    private func togglePlayVoiceNote(_ note: VoiceNoteItem) {
        if activePlayingVoiceNoteId == note.id {
            stopVoicePlayer()
        } else {
            stopVoicePlayer()
            do {
                voicePlayer = try AVAudioPlayer(contentsOf: note.url)
                voicePlayer?.play()
                activePlayingVoiceNoteId = note.id
            } catch {
                print("Erro ao reproduzir nota:", error)
            }
        }
    }
    
    private func stopVoicePlayer() {
        voicePlayer?.stop()
        voicePlayer = nil
        activePlayingVoiceNoteId = nil
    }
    
    private func deleteVoiceNote(_ note: VoiceNoteItem) {
        stopVoicePlayer()
        try? FileManager.default.removeItem(at: note.url)
        loadVoiceNotes()
    }
    
    // MARK: - Anotações em Texto Persistentes
    private func saveTextNote(_ note: String) {
        UserDefaults.standard.set(note, forKey: "artigo_note_\(artigo.id)")
    }
    
    private func loadSavedNotes() {
        userTextNote = UserDefaults.standard.string(forKey: "artigo_note_\(artigo.id)") ?? ""
    }
    
    // MARK: - Dados Mock de Jurisprudência
    private func getMockJurisprudencias() -> [JurisprudenciaItem] {
        return [
            JurisprudenciaItem(
                tribunal: "STF",
                tipo: "Súmula Vinculante",
                numero: "56",
                tese: "A falta de estabelecimento penal adequado não autoriza a manutenção do condenado em regime prisional mais gravoso.",
                ano: "2023"
            ),
            JurisprudenciaItem(
                tribunal: "STJ",
                tipo: "Tema Repetitivo",
                numero: "1092",
                tese: "É admissível o controle jurisdicional das decisões administrativas em estrita conformidade com a legalidade estrita e devido processo legal.",
                ano: "2024"
            ),
            JurisprudenciaItem(
                tribunal: "STF",
                tipo: "Tema RG",
                numero: "990",
                tese: "É constitucional o compartilhamento dos relatórios de inteligência financeira do UIF e da Receita Federal com órgãos de persecução penal.",
                ano: "2022"
            )
        ]
    }
    
    private func formatDuration(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd/MM/yyyy HH:mm"
        return formatter.string(from: date)
    }
    
    private func haptic() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
}

// Extensão de Cor Hexadecimal
extension Color {
    init(hex: UInt, alpha: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 08) & 0xff) / 255,
            blue: Double((hex >> 00) & 0xff) / 255,
            opacity: alpha
        )
    }
    
    init(hex: String) {
        var cleanHex = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if cleanHex.hasPrefix("#") { cleanHex.remove(at: cleanHex.startIndex) }
        var rgbValue: UInt64 = 0
        Scanner(string: cleanHex).scanHexInt64(&rgbValue)
        self.init(hex: UInt(rgbValue))
    }
}
