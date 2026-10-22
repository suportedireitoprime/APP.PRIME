import SwiftUI
import WebKit

struct NativeVideoaulaItem: Identifiable {
    let id: String
    let videoId: String
    let titulo: String
    let area: String
    var duracaoSegundos: Int = 1800
    var descricao: String = ""
}

struct VideoaulaPlayerView: View {
    @State var aula: NativeVideoaulaItem
    let playlist: [NativeVideoaulaItem]
    let onProgressUpdate: (Int, Int, Bool) -> Void
    let onClose: () -> Void

    @State private var isConcluida: Bool = false
    @State private var showFullDesc: Bool = false
    private let hapticImpact = UIImpactFeedbackGenerator(style: .medium)

    var body: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)

            VStack(spacing: 0) {
                // ── Top Bar ───────────────────────────────────────────
                HStack(spacing: 12) {
                    Button(action: {
                        hapticImpact.impactOccurred()
                        onClose()
                    }) {
                        Image(systemName: "arrow.left")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color(white: 0.15))
                            .clipShape(Circle())
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(aula.area.uppercased())
                            .font(.system(size: 11, weight: .black))
                            .tracking(1)
                            .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                        Text(aula.titulo)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.top, 10)
                .padding(.bottom, 8)
                .background(Color(white: 0.06))

                // ── PLAYER 16:9 COM ACELERAÇÃO NATIVA ─────────────────
                GeometryReader { geo in
                    let w = geo.size.width
                    let h = w * (9.0 / 16.0)

                    YouTubeNativePlayerRepresentable(videoId: aula.videoId)
                        .frame(width: w, height: h)
                        .background(Color.black)
                }
                .aspectRatio(16.0 / 9.0, contentMode: .fit)

                // ── DETALHES & TRILHA DA DISCIPLINA ───────────────────
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 16) {
                        // Título & Metadados
                        VStack(alignment: .leading, spacing: 6) {
                            Text(aula.titulo)
                                .font(.system(size: 17, weight: .black))
                                .foregroundColor(.white)

                            HStack(spacing: 8) {
                                Text(aula.area)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(Color(red: 0.96, green: 0.62, blue: 0.04))
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color(red: 0.96, green: 0.62, blue: 0.04).opacity(0.15))
                                    .cornerRadius(6)

                                Text("• 30 min")
                                    .font(.system(size: 12))
                                    .foregroundColor(Color.gray)
                            }
                        }

                        // Botões de Ação
                        HStack(spacing: 10) {
                            Button(action: {
                                hapticImpact.impactOccurred()
                                isConcluida.toggle()
                                onProgressUpdate(aula.duracaoSegundos, aula.duracaoSegundos, isConcluida)
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: isConcluida ? "checkmark.circle.fill" : "checkmark")
                                    Text(isConcluida ? "Concluída" : "Marcar Concluída")
                                        .font(.system(size: 13, weight: .bold))
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                                .background(isConcluida ? Color(red: 0.21, green: 0.69, blue: 0.52) : Color(white: 0.16))
                                .cornerRadius(12)
                            }

                            Button(action: {
                                hapticImpact.impactOccurred()
                            }) {
                                Image(systemName: "bookmark")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(width: 44, height: 44)
                                    .background(Color(white: 0.16))
                                    .cornerRadius(12)
                            }
                        }

                        if !aula.descricao.isEmpty {
                            Text(aula.descricao)
                                .font(.system(size: 13))
                                .lineSpacing(4)
                                .foregroundColor(Color.gray)
                                .lineLimit(showFullDesc ? nil : 2)
                                .onTapGesture {
                                    withAnimation { showFullDesc.toggle() }
                                }
                        }

                        // Lista da Trilha
                        if !playlist.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("AULAS DA DISCIPLINA")
                                    .font(.system(size: 11, weight: .black))
                                    .tracking(1)
                                    .foregroundColor(Color.gray)
                                    .padding(.top, 8)

                                ForEach(playlist) { item in
                                    let isCurrent = item.id == aula.id
                                    HStack(spacing: 12) {
                                        Image(systemName: isCurrent ? "play.circle.fill" : "play.circle")
                                            .font(.system(size: 22))
                                            .foregroundColor(isCurrent ? Color(red: 0.96, green: 0.62, blue: 0.04) : Color.gray)

                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(item.titulo)
                                                .font(.system(size: 13, weight: isCurrent ? .bold : .medium))
                                                .foregroundColor(isCurrent ? Color(red: 0.96, green: 0.62, blue: 0.04) : .white)
                                                .lineLimit(1)
                                            Text("Vídeo • 30 min")
                                                .font(.system(size: 11))
                                                .foregroundColor(Color.gray)
                                        }

                                        Spacer()
                                    }
                                    .padding(12)
                                    .background(isCurrent ? Color(white: 0.12) : Color(white: 0.06))
                                    .cornerRadius(12)
                                    .onTapGesture {
                                        hapticImpact.impactOccurred()
                                        aula = item
                                    }
                                }
                            }
                        }

                        Spacer(modifier: .padding(.bottom, 30))
                    }
                    .padding(16)
                }
            }
        }
    }
}

// ── Representable do Player YouTube ──────────────────────────────────
struct YouTubeNativePlayerRepresentable: UIViewRepresentable {
    let videoId: String

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        loadEmbed(webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        loadEmbed(uiView)
    }

    private func loadEmbed(_ webView: WKWebView) {
        let html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body, html { width: 100%; height: 100%; background-color: #000; overflow: hidden; }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <iframe 
                    src="https://www.youtube.com/embed/\(videoId)?autoplay=1&playsinline=1&rel=0&modestbranding=1" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </body>
            </html>
        """
        webView.loadHTMLString(html, baseURL: URL(string: "https://www.youtube.com"))
    }
}
