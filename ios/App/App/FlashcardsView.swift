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
                    
                    SwipeableCardView()
                } else {
                    Text("Gráficos e Histórico Nativos")
                        .foregroundColor(.gray)
                }
                
                Spacer().frame(height: 16)
                
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

struct SwipeableCardView: View {
    @State private var offset = CGSize.zero
    @State private var cardText = "Cartão Nativo\nArraste-me!"
    @State private var cardColor = Color(red: 0.17, green: 0.58, blue: 0.44) // #2C9570
    
    let impactMed = UIImpactFeedbackGenerator(style: .medium)
    let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)

    var body: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(cardColor)
            .frame(width: 280, height: 400)
            .overlay(
                Text(cardText)
                    .foregroundColor(.white)
                    .fontWeight(.bold)
                    .multilineTextAlignment(.center)
                    .font(.title3)
            )
            .offset(x: offset.width, y: offset.height)
            .rotationEffect(.degrees(Double(offset.width / 20)))
            .gesture(
                DragGesture()
                    .onChanged { gesture in
                        offset = gesture.translation
                        // Micro haptics
                        if abs(Int(offset.width)) % 100 < 5 {
                            impactMed.impactOccurred()
                        }
                    }
                    .onEnded { _ in
                        if abs(offset.width) > 150 {
                            // Sucesso (Swipe forte)
                            impactHeavy.impactOccurred()
                            let isRight = offset.width > 0
                            
                            cardText = isRight ? "Fácil!" : "Difícil!"
                            cardColor = isRight ? Color.green : Color.red
                            
                            withAnimation(.spring()) {
                                offset.width = isRight ? 1000 : -1000
                            }
                            
                            // Reset após sair da tela
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                offset = .zero
                                cardText = "Próximo Cartão\nArraste-me!"
                                cardColor = Color(red: 0.17, green: 0.58, blue: 0.44)
                            }
                            
                        } else {
                            // Cancela swipe
                            withAnimation(.spring()) {
                                offset = .zero
                            }
                        }
                    }
            )
            .animation(.spring(), value: offset)
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
