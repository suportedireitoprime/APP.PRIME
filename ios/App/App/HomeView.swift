import SwiftUI

struct NativeBookItemModel: Identifiable {
    let id: String
    let title: String
    let author: String
    let year: String
}

struct HomeView: View {
    let nome: String
    let perfilLabel: String
    let unreadCount: Int
    let onNavigate: (String) -> Void
    var onSearch: (() -> Void)? = nil
    var onOpenSidebar: (() -> Void)? = nil
    var onOpenNotifications: (() -> Void)? = nil

    private let sampleBooks = [
        NativeBookItemModel(id: "1", title: "Como as Democracias Morrem", author: "Steven Levitsky & Daniel Ziblatt", year: "2018"),
        NativeBookItemModel(id: "2", title: "O Último Dia de um Condenado", author: "Victor Hugo", year: "1829"),
        NativeBookItemModel(id: "3", title: "Dos Delitos e das Penas", author: "Cesare Beccaria", year: "1764"),
        NativeBookItemModel(id: "4", title: "O Caso dos Exploradores", author: "Lon L. Fuller", year: "1949")
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            // Fundo escuro vinho
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.54, green: 0.06, blue: 0.10),
                    Color(red: 0.28, green: 0.02, blue: 0.04),
                    Color(red: 0.08, green: 0.01, blue: 0.02),
                    Color(red: 0.05, green: 0.05, blue: 0.05)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            .edgesIgnoringSafeArea(.all)

            // Conteúdo Rolável
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 20) {
                    // ── TOP BAR: Perfil, Notificações & Menu ─────────────────
                    HStack {
                        // Avatar e Perfil
                        Button(action: { onNavigate("/meu-espaco") }) {
                            HStack(spacing: 12) {
                                ZStack {
                                    Circle()
                                        .fill(Color(red: 0.45, green: 0.05, blue: 0.08))
                                        .frame(width: 52, height: 52)
                                        .overlay(
                                            Circle().stroke(Color.white, lineWidth: 2)
                                        )

                                    Text(nome.prefix(1).uppercased())
                                        .font(.system(size: 22, weight: .black))
                                        .foregroundColor(.white)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    HStack(spacing: 4) {
                                        Text(nome.uppercased())
                                            .font(.system(size: 17, weight: .heavy))
                                            .foregroundColor(.white)
                                        Text("🪶")
                                            .font(.system(size: 14))
                                    }

                                    Text(perfilLabel)
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(Color(red: 0.88, green: 0.91, blue: 0.94))
                                }
                            }
                        }

                        Spacer()

                        // Botões Topo Direito
                        HStack(spacing: 10) {
                            // Sino
                            Button(action: { onOpenNotifications?() }) {
                                ZStack(alignment: .topTrailing) {
                                    Circle()
                                        .fill(Color.black.opacity(0.65))
                                        .frame(width: 46, height: 46)
                                        .overlay(
                                            Circle().stroke(Color.white.opacity(0.15), lineWidth: 1)
                                        )
                                        .overlay(Text("🔔").font(.system(size: 17)))

                                    if unreadCount > 0 {
                                        Text(unreadCount > 99 ? "99+" : "\(unreadCount)")
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 5)
                                            .padding(.vertical, 1)
                                            .background(Color(red: 0.9, green: 0.22, blue: 0.21))
                                            .clipShape(Capsule())
                                            .offset(x: 4, y: -2)
                                    }
                                }
                            }

                            // Menu Hambúrguer
                            Button(action: { onOpenSidebar?() }) {
                                Circle()
                                    .fill(Color.black.opacity(0.65))
                                    .frame(width: 46, height: 46)
                                    .overlay(
                                        Circle().stroke(Color.white.opacity(0.15), lineWidth: 1)
                                    )
                                    .overlay(
                                        Text("☰")
                                            .font(.system(size: 20, weight: .bold))
                                            .foregroundColor(.white)
                                    )
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    // ── HERO CENTRAL: Themis & Estudos Jurídicos ─────────────
                    VStack(spacing: 4) {
                        if let image = UIImage(named: "logo_prime") {
                            Image(uiImage: image)
                                .resizable()
                                .scaledToFit()
                                .frame(height: 110)
                                .padding(.vertical, 4)
                        } else {
                            Text("⚖️")
                                .font(.system(size: 64))
                        }

                        Text("Estudos Jurídicos")
                            .font(.system(size: 26, weight: .bold, design: .serif))
                            .italic()
                            .foregroundColor(.white)

                        Text("USO PROFISSIONAL")
                            .font(.system(size: 12, weight: .semibold))
                            .tracking(2.5)
                            .foregroundColor(Color.white.opacity(0.85))
                    }
                    .padding(.top, 4)

                    // ── BARRA DE PESQUISA ────────────────────────────────────
                    Button(action: { onSearch?() ?? onNavigate("/search") }) {
                        HStack {
                            Text("🔍")
                                .font(.system(size: 18))
                            Text("Pesquise leis, artigos, súmulas...")
                                .font(.system(size: 14))
                                .foregroundColor(Color.white.opacity(0.65))

                            Spacer()

                            Text("PESQUISAR")
                                .font(.system(size: 12, weight: .black))
                                .tracking(0.8)
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(Color(red: 0.72, green: 0.11, blue: 0.11))
                                .cornerRadius(12)
                        }
                        .padding(.leading, 14)
                        .padding(.trailing, 6)
                        .frame(height: 58)
                        .background(Color.black.opacity(0.55))
                        .cornerRadius(18)
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(Color(red: 0.54, green: 0.06, blue: 0.1).opacity(0.5), lineWidth: 1)
                        )
                    }
                    .padding(.horizontal, 16)

                    // ── GRID DE 4 AÇÕES RÁPIDAS (Cards Táteis) ───────────────
                    HStack(spacing: 8) {
                        QuickActionView(label: "ME EXPLIQUE", icon: "📷", color: Color(red: 0.98, green: 0.45, blue: 0.09)) {
                            onNavigate("/me-explique")
                        }
                        QuickActionView(label: "FLASHCARDS", icon: "🗂️", color: Color(red: 0.20, green: 0.83, blue: 0.60)) {
                            onNavigate("/flashcards")
                        }
                        QuickActionView(label: "QUESTÕES", icon: "☑️", color: Color(red: 0.97, green: 0.44, blue: 0.44)) {
                            onNavigate("/questoes")
                        }
                        QuickActionView(label: "DESKTOP", icon: "💻", color: Color(red: 0.23, green: 0.51, blue: 0.96)) {
                            onNavigate("/desktop")
                        }
                    }
                    .padding(.horizontal, 16)

                    // ── SEÇÃO: RECOMENDAÇÃO DE LIVRO ────────────────────────
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(red: 0.90, green: 0.22, blue: 0.21))
                                .frame(width: 4, height: 20)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("RECOMENDAÇÃO DE LIVRO")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                Text("clássicos e obras do Direito")
                                    .font(.system(size: 12))
                                    .foregroundColor(.gray)
                            }
                        }
                        .padding(.horizontal, 16)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 14) {
                                ForEach(sampleBooks) { book in
                                    Button(action: { onNavigate("/biblioteca") }) {
                                        VStack(alignment: .leading, spacing: 12) {
                                            HStack(alignment: .top) {
                                                Text(book.title)
                                                    .font(.system(size: 13, weight: .bold))
                                                    .foregroundColor(.white)
                                                    .lineLimit(2)
                                                    .multilineTextAlignment(.leading)

                                                Spacer()

                                                Circle()
                                                    .fill(Color.white.opacity(0.1))
                                                    .frame(width: 28, height: 28)
                                                    .overlay(
                                                        Text("↗")
                                                            .font(.system(size: 14))
                                                            .foregroundColor(.white)
                                                    )
                                            }

                                            Spacer()

                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(book.author)
                                                    .font(.system(size: 11))
                                                    .foregroundColor(.gray)
                                                    .lineLimit(1)

                                                Text(book.year)
                                                    .font(.system(size: 10, weight: .bold))
                                                    .foregroundColor(Color(red: 0.90, green: 0.22, blue: 0.21))
                                            }
                                        }
                                        .padding(14)
                                        .frame(width: 200, height: 130)
                                        .background(
                                            LinearGradient(
                                                gradient: Gradient(colors: [
                                                    Color(red: 0.12, green: 0.03, blue: 0.04),
                                                    Color(red: 0.20, green: 0.04, blue: 0.06),
                                                    Color(red: 0.08, green: 0.01, blue: 0.02)
                                                ]),
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                        .cornerRadius(18)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 18)
                                                .stroke(Color.white.opacity(0.15), lineWidth: 1)
                                        )
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                    .padding(.top, 8)

                    Spacer().frame(height: 110)
                }
            }

            // ── BOTTOM NAVIGATION BAR (Com botão Vade Mecum elevado) ─
            ZStack(alignment: .top) {
                // Barra base
                VStack(spacing: 0) {
                    HStack {
                        BottomNavItemView(icon: "📜", label: "Blog") { onNavigate("/blog") }
                        BottomNavItemView(icon: "💬", label: "Chat") { onNavigate("/chat") }

                        Spacer().frame(width: 68) // Espaço para botão central

                        BottomNavItemView(icon: "🔨", label: "Ferramentas") { onNavigate("/ferramentas") }
                        BottomNavItemView(icon: "💊", label: "Pílulas") { onNavigate("/pilulas") }
                    }
                    .frame(height: 64)
                    .padding(.horizontal, 10)
                    .background(Color(red: 0.06, green: 0.06, blue: 0.06))
                    .cornerRadius(22, corners: [.topLeft, .topRight])
                    .overlay(
                        RoundedCorner(radius: 22, corners: [.topLeft, .topRight])
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                }

                // Botão central flutuante do Vade Mecum
                Button(action: { onNavigate("/vade-mecum") }) {
                    ZStack {
                        Circle()
                            .fill(
                                RadialGradient(
                                    gradient: Gradient(colors: [
                                        Color(red: 0.90, green: 0.22, blue: 0.21),
                                        Color(red: 0.54, green: 0.06, blue: 0.10)
                                    ]),
                                    center: .center,
                                    startRadius: 5,
                                    endRadius: 36
                                )
                            )
                            .frame(width: 68, height: 68)
                            .shadow(color: Color.black.opacity(0.6), radius: 12, x: 0, y: 8)
                            .overlay(
                                Circle().stroke(Color.white.opacity(0.3), lineWidth: 2)
                            )

                        Text("⚖️")
                            .font(.system(size: 28))
                    }
                }
                .offset(y: -24)
            }
        }
    }
}

struct QuickActionView: View {
    let label: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(icon)
                    .font(.system(size: 22))

                Text(label)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .tracking(-0.2)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 76)
            .background(Color.black.opacity(0.5))
            .cornerRadius(18)
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
            )
        }
    }
}

struct BottomNavItemView: View {
    let icon: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Text(icon)
                    .font(.system(size: 20))
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color.white.opacity(0.85))
            }
            .frame(maxWidth: .infinity)
        }
    }
}

// Helper para cantos específicos arredondados no SwiftUI
struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}
