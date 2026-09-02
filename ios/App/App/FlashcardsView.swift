import SwiftUI

struct FlashcardsView: View {
    var isStudySession: Bool
    var category: String
    var onClose: () -> Void
    
    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.05)
                .edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 24) {
                Text(isStudySession ? "Sessão Nativa de Flashcards" : "Dashboard Nativo")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                if isStudySession {
                    Text("Categoria: \(category)")
                        .foregroundColor(.gray)
                    
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(red: 0.17, green: 0.58, blue: 0.44)) // #2C9570
                        .frame(width: 280, height: 400)
                        .overlay(
                            Text("Cartão 3D Nativo (Em Breve)")
                                .foregroundColor(.white)
                                .fontWeight(.bold)
                        )
                } else {
                    Text("Gráficos e Histórico Nativos")
                        .foregroundColor(.gray)
                }
                
                Button(action: {
                    onClose()
                }) {
                    Text("Voltar para o App (Web)")
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: 200)
                        .background(Color(red: 0.06, green: 0.73, blue: 0.51)) // #10b981
                        .cornerRadius(12)
                }
            }
            .padding(32)
            .background(Color(red: 0.12, green: 0.12, blue: 0.12))
            .cornerRadius(24)
        }
    }
}

import UIKit

class FlashcardsHostingController: UIHostingController<FlashcardsView> {
    init(isStudySession: Bool, category: String) {
        var closeAction: (() -> Void)? = nil
        let view = FlashcardsView(isStudySession: isStudySession, category: category) {
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
