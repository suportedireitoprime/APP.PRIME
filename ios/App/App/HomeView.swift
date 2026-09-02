import SwiftUI

struct HomeView: View {
    let nome: String
    let perfilLabel: String
    let unreadCount: Int
    let onNavigate: (String) -> Void
    
    var body: some View {
        ZStack {
            // Fundo
            LinearGradient(
                gradient: Gradient(colors: [Color(red: 0.54, green: 0, blue: 0), Color.black]),
                startPoint: .top,
                endPoint: .bottom
            )
            .edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 24) {
                // Header
                HStack {
                    HStack(spacing: 12) {
                        Circle()
                            .fill(Color.gray)
                            .frame(width: 56, height: 56)
                        
                        VStack(alignment: .leading) {
                            Text(nome)
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                            Text(perfilLabel)
                                .font(.system(size: 14))
                                .foregroundColor(.gray)
                        }
                    }
                    Spacer()
                    
                    HStack(spacing: 8) {
                        ZStack(alignment: .topTrailing) {
                            Circle()
                                .fill(Color.black.opacity(0.5))
                                .frame(width: 48, height: 48)
                                .overlay(Text("🔔").foregroundColor(.white))
                            
                            if unreadCount > 0 {
                                Circle()
                                    .fill(Color.red)
                                    .frame(width: 20, height: 20)
                                    .overlay(
                                        Text("\(unreadCount)")
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundColor(.white)
                                    )
                                    .offset(x: 5, y: -5)
                            }
                        }
                        
                        Circle()
                            .fill(Color.black.opacity(0.5))
                            .frame(width: 48, height: 48)
                            .overlay(Text("☰").foregroundColor(.white))
                    }
                }
                .padding(.horizontal)
                
                // Hero Section
                VStack(spacing: 16) {
                    Circle()
                        .fill(Color.darkGray)
                        .frame(width: 120, height: 120)
                    
                    Text("Estudos Jurídicos")
                        .font(.system(size: 32, weight: .bold, design: .serif))
                        .foregroundColor(.white)
                    
                    Text("USO PROFISSIONAL")
                        .font(.system(size: 14, weight: .bold))
                        .tracking(2)
                        .foregroundColor(Color.white.opacity(0.8))
                }
                
                // Search Bar
                HStack {
                    Text("🔍")
                        .foregroundColor(.gray)
                    Text("Pesquise súmulas...")
                        .foregroundColor(.gray)
                    Spacer()
                    Button(action: { onNavigate("/search") }) {
                        Text("PESQUISAR")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.red)
                            .cornerRadius(8)
                    }
                }
                .padding(.horizontal, 16)
                .frame(height: 56)
                .background(Color.black.opacity(0.6))
                .cornerRadius(16)
                .padding(.horizontal)
                
                // Quick Actions
                HStack(spacing: 12) {
                    QuickActionButton(label: "Me Explique", icon: "📸", color: .orange) { onNavigate("/me-explique") }
                    QuickActionButton(label: "Flashcards", icon: "📚", color: .green) { onNavigate("/flashcards") }
                    QuickActionButton(label: "Questões", icon: "✓", color: .red) { onNavigate("/questoes") }
                    QuickActionButton(label: "Desktop", icon: "💻", color: .blue) { onNavigate("/desktop") }
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .padding(.top, 16)
        }
    }
}

struct QuickActionButton: View {
    let label: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
                
                Text(label.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.black.opacity(0.5))
            .cornerRadius(16)
        }
    }
}

extension Color {
    static let darkGray = Color(red: 0.2, green: 0.2, blue: 0.2)
}
