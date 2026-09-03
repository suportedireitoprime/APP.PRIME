import Capacitor
import SwiftUI

@objc(NativeFlashcardsPlugin)
public class NativeFlashcardsPlugin: CAPPlugin {
    
    private var hostingController: UIHostingController<FlashcardsView>?

    @objc func openSession(_ call: CAPPluginCall) {
        let titulo = call.getString("titulo") ?? "Flashcards"
        let startIndex = call.getInt("startIndex") ?? 0
        let cardsRaw = call.getArray("cards", JSObject.self) ?? []

        let cards: [FlashcardItemModel] = cardsRaw.compactMap { obj in
            guard let id = obj["id"] as? String,
                  let pergunta = obj["pergunta"] as? String,
                  let resposta = obj["resposta"] as? String else { return nil }
            return FlashcardItemModel(
                id: id,
                pergunta: pergunta,
                resposta: resposta,
                area: obj["area"] as? String ?? "Direito",
                tema: obj["tema"] as? String ?? "",
                subtema: obj["subtema"] as? String ?? "",
                exemplo: obj["exemplo"] as? String ?? "",
                baseLegal: obj["base_legal"] as? String ?? "",
                dica: obj["dica"] as? String ?? "",
                artigoNumero: obj["artigo_numero"] as? String ?? ""
            )
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rootVC = self.bridge?.viewController else {
                call.reject("Unable to find root view controller")
                return
            }

            let flashcardsView = FlashcardsView(
                titulo: titulo,
                cards: cards,
                startIndex: startIndex,
                onCardAnswered: { [weak self] cardId, status, area, tema in
                    self?.notifyListeners("onCardAnswered", data: [
                        "cardId": cardId,
                        "status": status,
                        "area": area,
                        "tema": tema
                    ])
                },
                onSessionCompleted: { [weak self] total, compreendidos, revisar in
                    self?.notifyListeners("onSessionCompleted", data: [
                        "total": total,
                        "compreendidos": compreendidos,
                        "revisar": revisar
                    ])
                },
                onClose: { [weak self] in
                    self?.dismissSession()
                    self?.notifyListeners("onClose", data: [:])
                }
            )

            let hostingVC = UIHostingController(rootView: flashcardsView)
            hostingVC.modalPresentationStyle = .fullScreen
            self.hostingController = hostingVC
            rootVC.present(hostingVC, animated: true) {
                call.resolve(["success": true])
            }
        }
    }

    @objc func closeSession(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.dismissSession()
            call.resolve(["success": true])
        }
    }

    private func dismissSession() {
        hostingController?.dismiss(animated: true, completion: nil)
        hostingController = nil
    }
}
