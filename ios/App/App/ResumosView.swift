import SwiftUI

struct ResumosView: View {
    var initialArea: String?
    var initialTema: String?
    var payload: String?
    var isReader: Bool
    
    var onBack: () -> Void
    
    // UI Constants based on the project's aesthetics
    let darkBg = Color(red: 13/255, green: 13/255, blue: 13/255)
    let cardBg = Color(red: 26/255, green: 26/255, blue: 26/255)
    
    var body: some View {
        NavigationView {
            ZStack {
                darkBg.edgesIgnoringSafeArea(.all)
                
                if isReader {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Área: \(initialArea ?? "")")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        Text(initialTema ?? "")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Carregando conteúdo nativo do resumo...")
                            .foregroundColor(.white)
                            .padding(.top, 16)
                        
                        Spacer()
                    }
                    .padding()
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            Text(initialArea != nil ? "Temas de \(initialArea!)" : "Áreas do Direito")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal)
                                .padding(.top, 16)
                            
                            ForEach(0..<5) { index in
                                Button(action: {
                                    // Handle click (navigate deeper)
                                }) {
                                    HStack {
                                        VStack(alignment: .leading) {
                                            Text(initialArea != nil ? "Tema \(index + 1)" : "Área \(index + 1)")
                                                .font(.headline)
                                                .foregroundColor(.white)
                                            
                                            Text("Toque para ver os resumos")
                                                .font(.caption)
                                                .foregroundColor(.gray)
                                        }
                                        Spacer()
                                    }
                                    .padding()
                                    .background(cardBg)
                                    .cornerRadius(12)
                                }
                                .padding(.horizontal)
                            }
                        }
                        .padding(.bottom, 24)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Resumos Jurídicos")
                        .font(.headline)
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: onBack) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.white)
                    }
                }
            }
        }
        // Force NavigationBar color
        .onAppear {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(red: 13/255, green: 13/255, blue: 13/255, alpha: 1)
            appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
            
            UINavigationBar.appearance().standardAppearance = appearance
            UINavigationBar.appearance().compactAppearance = appearance
            UINavigationBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}
