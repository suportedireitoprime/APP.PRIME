import SwiftUI

struct Noticia: Identifiable, Decodable {
    let id: String
    let titulo: String
    let resumo: String?
    let fonte: String?
    let data_publicacao: String
    let conteudo_md: String?
    let conteudo: String?
}

struct NewsView: View {
    var accessToken: String
    var onClose: () -> Void
    
    @State private var noticias: [Noticia] = []
    @State private var isLoading = true
    @State private var errorMessage: String? = nil
    @State private var selectedNoticia: Noticia? = nil
    
    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.05).edgesIgnoringSafeArea(.all)
            
            if let selected = selectedNoticia {
                NewsDetailView(noticia: selected, onBack: { selectedNoticia = nil })
            } else {
                VStack(spacing: 0) {
                    HStack {
                        Button(action: onClose) {
                            Text("< Voltar")
                                .foregroundColor(Color(red: 0.06, green: 0.73, blue: 0.51)) // #10b981
                        }
                        Spacer()
                        Text("Notícias Jurídicas")
                            .font(.headline)
                            .foregroundColor(.white)
                        Spacer()
                        // Placeholder to balance
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
                        List(noticias) { noticia in
                            Button(action: { selectedNoticia = noticia }) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(noticia.titulo)
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(.white)
                                    
                                    let fonteLabel = noticia.fonte ?? "Migalhas"
                                    let dateLabel = String(noticia.data_publicacao.prefix(10))
                                    Text("\(fonteLabel) • \(dateLabel)")
                                        .font(.system(size: 12))
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
            fetchNews()
        }
    }
    
    private func fetchNews() {
        guard let url = URL(string: "https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/noticias_juridicas?select=*&order=data_publicacao.desc&limit=50") else { return }
        
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
                        let result = try decoder.decode([Noticia].self, from: data)
                        self.noticias = result
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

struct NewsDetailView: View {
    var noticia: Noticia
    var onBack: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(action: onBack) {
                    Text("< Voltar")
                        .foregroundColor(Color(red: 0.06, green: 0.73, blue: 0.51))
                }
                Spacer()
                Text("Detalhes")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Text("< Voltar").hidden()
            }
            .padding()
            .background(Color(red: 0.12, green: 0.12, blue: 0.12))
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(noticia.titulo)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                    
                    let bodyText = (noticia.conteudo_md ?? noticia.conteudo) ?? noticia.resumo ?? ""
                    
                    Text(bodyText)
                        .font(.system(size: 16))
                        .foregroundColor(Color(red: 0.8, green: 0.8, blue: 0.8))
                        .lineSpacing(8)
                }
                .padding()
            }
        }
    }
}

import UIKit

class NewsHostingController: UIHostingController<NewsView> {
    init(accessToken: String) {
        var closeAction: (() -> Void)? = nil
        let view = NewsView(accessToken: accessToken) {
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
