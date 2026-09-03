import Capacitor
import SwiftUI

@objc(NativeQuestoesPlugin)
public class NativeQuestoesPlugin: CAPPlugin {
    
    private var hostingController: UIHostingController<QuestoesView>?

    @objc func openSession(_ call: CAPPluginCall) {
        let titulo = call.getString("titulo") ?? "Questões"
        let startIndex = call.getInt("startIndex") ?? 0
        let contexto = call.getString("contexto") ?? "pratica"
        let questoesRaw = call.getArray("questoes", JSObject.self) ?? []

        let questoes: [QuestaoItemModel] = questoesRaw.compactMap { obj in
            guard let id = obj["id"] as? String,
                  let enunciado = obj["enunciado"] as? String else { return nil }
            return QuestaoItemModel(
                id: id,
                enunciado: enunciado,
                altA: obj["alt_a"] as? String ?? "",
                altB: obj["alt_b"] as? String ?? "",
                altC: obj["alt_c"] as? String ?? "",
                altD: obj["alt_d"] as? String ?? "",
                altE: obj["alt_e"] as? String ?? "",
                gabaritoOficial: (obj["gabarito_oficial"] as? String ?? "A").trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
                gabaritoComentado: obj["gabarito_comentado"] as? String ?? "",
                disciplina: obj["disciplina"] as? String ?? "",
                assunto: obj["assunto"] as? String ?? "",
                ano: obj["ano"] as? Int ?? 2024,
                banca: obj["banca"] as? String ?? "",
                orgao: obj["orgao"] as? String ?? ""
            )
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rootVC = self.bridge?.viewController else {
                call.reject("Unable to find root view controller")
                return
            }

            let questoesView = QuestoesView(
                titulo: titulo,
                questoes: questoes,
                startIndex: startIndex,
                contexto: contexto,
                onQuestaoAnswered: { [weak self] questaoId, alternativa, acertou, tempo in
                    self?.notifyListeners("onQuestaoAnswered", data: [
                        "questaoId": questaoId,
                        "alternativa": alternativa,
                        "acertou": acertou,
                        "tempoSegundos": tempo
                    ])
                },
                onSessionCompleted: { [weak self] total, acertos, erros, tempoTotal in
                    self?.notifyListeners("onSessionCompleted", data: [
                        "total": total,
                        "acertos": acertos,
                        "erros": erros,
                        "tempoTotalSegundos": tempoTotal
                    ])
                },
                onClose: { [weak self] in
                    self?.dismissSession()
                    self?.notifyListeners("onClose", data: [:])
                }
            )

            let hostingVC = UIHostingController(rootView: questoesView)
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
