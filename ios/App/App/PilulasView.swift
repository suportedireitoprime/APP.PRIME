import SwiftUI
import AVFoundation

struct Pilula: Identifiable, Decodable {
    let id: String
    let titulo: String
    let autor: String?
    let capa: String?
    let audio_resumo_url: String?
    let resumo: String?
}

class AudioPlayerManager: ObservableObject {
    var player: AVPlayer?
    @Published var isPlaying = false
    
    func play(url: String) {
        guard let audioUrl = URL(string: url) else { return }
        if player != nil {
            player?.pause()
        }
        player = AVPlayer(url: audioUrl)
        player?.play()
        isPlaying = true
    }
    
    func pause() {
        player?.pause()
        isPlaying = false
    }
    
    func togglePlay(url: String) {
        if isPlaying {
            pause()
        } else {
            if player == nil {
                play(url: url)
            } else {
                player?.play()
                isPlaying = true
            }
        }
    }
    
    func stop() {
        player?.pause()
        player = nil
        isPlaying = false
    }
}

struct PilulasView: View {
    var accessToken: String
    var startPilulaId: String
    var onClose: () -> Void
    
    @State private var pilulas: [Pilula] = []
    @State private var isLoading = true
    @State private var errorMessage: String? = nil
    @State private var selectedPilula: Pilula? = nil
    
    @StateObject private var audioManager = AudioPlayerManager()
    
    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.05).edgesIgnoringSafeArea(.all)
            
            if let selected = selectedPilula {
                PilulaPlayerView(
                    pilula: selected,
                    audioManager: audioManager,
                    onBack: {
                        audioManager.stop()
                        selectedPilula = nil
                    }
                )
            } else {
                VStack(spacing: 0) {
                    HStack {
                        Button(action: onClose) {
                            Text("< Voltar")
                                .foregroundColor(Color(red: 0.06, green: 0.73, blue: 0.51)) // #10b981
                        }
                        Spacer()
                        Text("Pílulas de Áudio")
                            .font(.headline)
                            .foregroundColor(.white)
                        Spacer()
                        Text("< Voltar").hidden()
                    }
                    .padding()
                    .background(Color(red: 0.12, green: 0.12, blue: 0.12))
                    
                    if isLoading {
                        Spacer()
                        ProgressView().progressViewStyle(CircularProgressViewStyle(tint: Color(red: 0.06, green: 0.73, blue: 0.51)))
                        Spacer()
                    } else if let error = errorMessage {
                        Spacer()
                        Text(error).foregroundColor(.red).padding()
                        Spacer()
                    } else {
                        List(pilulas) { pilula in
                            Button(action: {
                                selectedPilula = pilula
                                if let url = pilula.audio_resumo_url, !url.isEmpty {
                                    audioManager.play(url: url)
                                }
                            }) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(pilula.titulo)
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                    
                                    Text(pilula.autor ?? "Desconhecido")
                                        .font(.system(size: 14))
                                        .foregroundColor(.gray)
                                }
                                .padding(.vertical, 8)
                            }
                            .listRowBackground(Color(red: 0.12, green: 0.12, blue: 0.12))
                        }
                        .listStyle(PlainListStyle())
                        .padding(.top, 8)
                    }
                }
            }
        }
        .onAppear {
            fetchPilulas()
        }
    }
    
    private func fetchPilulas() {
        guard let url = URL(string: "https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/livros_classicos?select=*") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0", forHTTPHeaderField: "apikey")
        if !accessToken.isEmpty {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isLoading = false
                
                if let error = error {
                    self.errorMessage = "Erro de Rede: \(error.localizedDescription)"
                    return
                }
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    self.errorMessage = "Resposta Inválida"
                    return
                }
                
                if httpResponse.statusCode == 200, let data = data {
                    do {
                        let decoder = JSONDecoder()
                        let result = try decoder.decode([Pilula].self, from: data)
                        self.pilulas = result
                        
                        if !self.startPilulaId.isEmpty {
                            if let start = result.first(where: { $0.id == self.startPilulaId }) {
                                self.selectedPilula = start
                                if let url = start.audio_resumo_url, !url.isEmpty {
                                    self.audioManager.play(url: url)
                                }
                            }
                        }
                    } catch {
                        self.errorMessage = "Erro ao decodificar JSON: \(error.localizedDescription)"
                    }
                } else {
                    self.errorMessage = "Erro HTTP: \(httpResponse.statusCode)"
                }
            }
        }.resume()
    }
}

struct PilulaPlayerView: View {
    var pilula: Pilula
    @ObservedObject var audioManager: AudioPlayerManager
    var onBack: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(action: onBack) {
                    Text("< Voltar")
                        .foregroundColor(Color(red: 0.06, green: 0.73, blue: 0.51))
                }
                Spacer()
                Text("Tocador Nativo")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Text("< Voltar").hidden()
            }
            .padding()
            .background(Color(red: 0.12, green: 0.12, blue: 0.12))
            
            VStack {
                Spacer()
                
                // Capa Placeholder
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 200, height: 200)
                    .overlay(Text("Capa").foregroundColor(.white))
                
                Spacer().frame(height: 32)
                
                Text(pilula.titulo)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Spacer().frame(height: 8)
                
                Text(pilula.autor ?? "Desconhecido")
                    .font(.system(size: 16))
                    .foregroundColor(.gray)
                
                Spacer().frame(height: 48)
                
                if let url = pilula.audio_resumo_url, !url.isEmpty {
                    Button(action: {
                        audioManager.togglePlay(url: url)
                    }) {
                        Text(audioManager.isPlaying ? "Pausar" : "Ouvir Pílula")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(Color(red: 0.06, green: 0.73, blue: 0.51))
                            .cornerRadius(12)
                    }
                    .padding(.horizontal, 24)
                } else {
                    Text("Áudio indisponível")
                        .foregroundColor(.red)
                }
                
                Spacer()
            }
        }
    }
}

import UIKit

class PilulasHostingController: UIHostingController<PilulasView> {
    init(accessToken: String, startPilulaId: String) {
        var closeAction: (() -> Void)? = nil
        let view = PilulasView(accessToken: accessToken, startPilulaId: startPilulaId) {
            closeAction?()
        }
        super.init(rootView: view)
        closeAction = { [weak self] in
            self?.dismiss(animated: true, completion: nil)
        }
    }
    
    @MainActor required dynamic init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
