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

public struct ArtigoView: View {
    public let artigo: ArtigoData
    public var onClose: () -> Void
    public var onHighlightsChanged: (([String]) -> Void)?
    
    @State private var fontSize: CGFloat = 17
    @State private var highlightMode = false
    @State private var selectedColor = "#FACC15" // Amarelo padrão
    @State private var highlights: [String: String] = [:] // "line:word" -> colorHex
    
    // Áudio e TTS
    @State private var isPlaying = false
    @State private var player: AVPlayer?
    @State private var speechSynthesizer = AVSpeechSynthesizer()
    
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
                // Header Nativo
                headerView
                
                // Conteúdo do Artigo
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        // Badge da Lei / Tabela
                        if !artigo.tabelaNome.isEmpty {
                            Text(artigo.tabelaNome.replacingOccurrences(of: "_", with: " ").uppercased())
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(Color(hex: 0xE11D48))
                                .tracking(1.5)
                        }
                        
                        // Número e Título
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Art. \(artigo.numero)")
                                .font(.system(size: 26, weight: .black))
                                .foregroundColor(.white)
                            
                            if !artigo.titulo.isEmpty {
                                Text(artigo.titulo)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(Color(hex: 0x9CA3AF))
                            }
                        }
                        
                        Divider()
                            .background(Color.white.opacity(0.1))
                            .padding(.vertical, 4)
                        
                        // Caput
                        renderTextParagraph(text: artigo.caput, lineIndex: 0, prefix: "")
                        
                        // Parágrafos
                        ForEach(Array(artigo.paragrafos.enumerated()), id: \.offset) { idx, para in
                            renderTextParagraph(text: para, lineIndex: idx + 1, prefix: "")
                        }
                        
                        // Incisos
                        ForEach(Array(artigo.incisos.enumerated()), id: \.offset) { idx, inc in
                            renderTextParagraph(text: inc, lineIndex: artigo.paragrafos.count + idx + 1, prefix: "")
                        }
                        
                        Spacer(minLength: 120)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                }
                
                // Barra de Ações Inferior (Floating Bar)
                bottomActionBar
            }
        }
        .onAppear {
            setupInitialHighlights()
        }
        .onDisappear {
            stopAudio()
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        HStack(spacing: 14) {
            Button(action: {
                haptic()
                stopAudio()
                onClose()
            }) {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(Color.white.opacity(0.1))
                    .clipShape(Circle())
            }
            
            Spacer()
            
            // Controles de Tamanho de Fonte
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
            
            // Botão Modo Grifo
            Button(action: {
                haptic()
                highlightMode.toggle()
            }) {
                HStack(spacing: 5) {
                    Image(systemName: "highlighter")
                        .font(.system(size: 13, weight: .bold))
                    Text(highlightMode ? "Grifando" : "Grifar")
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundColor(highlightMode ? .black : .white)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(highlightMode ? Color(hex: 0xFACC15) : Color.white.opacity(0.1))
                .cornerRadius(12)
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .background(Color(hex: 0x141416))
    }
    
    // MARK: - Renderizador de Texto com Grifos
    private func renderTextParagraph(text: String, lineIndex: Int, prefix: String) -> some View {
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
    
    // MARK: - Barra de Ações Inferior
    private var bottomActionBar: some View {
        HStack(spacing: 24) {
            // Apagar Grifos
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
            .frame(width: 56)
            
            Spacer()
            
            // FAB Central de Narração
            Button(action: {
                haptic()
                toggleNarration()
            }) {
                ZStack {
                    Circle()
                        .fill(Color(hex: 0xE11D48))
                        .frame(width: 60, height: 60)
                        .shadow(color: Color(hex: 0xE11D48).opacity(0.4), radius: 10, y: 4)
                    
                    Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .offset(y: -14)
            
            Spacer()
            
            // Paleta de Cores de Grifo
            HStack(spacing: 8) {
                ForEach(highlightColors, id: \.0) { hex, _ in
                    Circle()
                        .fill(Color(hex: hex))
                        .frame(width: selectedColor == hex ? 24 : 18, height: selectedColor == hex ? 24 : 18)
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
            .frame(width: 140)
        }
        .padding(.horizontal, 24)
        .padding(.top, 10)
        .padding(.bottom, 24)
        .background(Color(hex: 0x141416))
    }
    
    // MARK: - Ações e Áudio
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
        emitHighlights()
    }
    
    private func setupInitialHighlights() {
        for item in artigo.initialHighlights {
            let parts = item.components(separatedBy: ":")
            if parts.count >= 3 {
                highlights["\(parts[0]):\(parts[1])"] = parts[2]
            }
        }
    }
    
    private func emitHighlights() {
        let serialized = highlights.map { "\($0.key):\($0.value)" }
        onHighlightsChanged?(serialized)
    }
    
    private func toggleNarration() {
        if isPlaying {
            stopAudio()
            isPlaying = false
        } else {
            playAudio()
        }
    }
    
    private func playAudio() {
        stopAudio()
        
        // Se houver streaming de áudio disponível
        if !artigo.audioUrl.isEmpty, let url = URL(string: artigo.audioUrl) {
            let playerItem = AVPlayerItem(url: url)
            player = AVPlayer(playerItem: playerItem)
            player?.play()
            isPlaying = true
            return
        }
        
        // Fallback para Sintetizador de Voz Nativo (AVSpeechSynthesizer)
        let fullText = "\(artigo.caput). " + artigo.paragrafos.joined(separator: ". ")
        let utterance = AVSpeechUtterance(string: fullText)
        utterance.voice = AVSpeechSynthesisVoice(language: "pt-BR")
        utterance.rate = 0.52
        speechSynthesizer.speak(utterance)
        isPlaying = true
    }
    
    private func stopAudio() {
        player?.pause()
        player = nil
        if speechSynthesizer.isSpeaking {
            speechSynthesizer.stopSpeaking(at: .immediate)
        }
        isPlaying = false
    }
    
    private func haptic() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
}

// Helper para cor Hexadecimal em SwiftUI
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
