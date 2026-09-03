import Capacitor
import SwiftUI

@objc(NativeVadeMecumPlugin)
public class NativeVadeMecumPlugin: CAPPlugin {
    
    public override func load() {
        super.load()
    }

    @objc func openArtigo(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        let numero = call.getString("numero") ?? ""
        let caput = call.getString("caput") ?? ""
        let titulo = call.getString("titulo") ?? ""
        let tabelaNome = call.getString("tabelaNome") ?? ""
        let paragrafos = call.getArray("paragrafos", String.self) ?? []
        let incisos = call.getArray("incisos", String.self) ?? []
        let audioUrl = call.getString("audioUrl") ?? ""
        
        let initialHighlights = (call.getArray("highlights", JSObject.self) ?? []).compactMap { obj -> String? in
            guard let line = obj["lineIndex"] as? Int,
                  let word = obj["wordIndex"] as? Int,
                  let color = obj["colorHex"] as? String else { return nil }
            return "\(line):\(word):\(color)"
        }
        
        let artigoData = ArtigoData(
            id: id,
            numero: numero,
            caput: caput,
            titulo: titulo,
            tabelaNome: tabelaNome,
            paragrafos: paragrafos,
            incisos: incisos,
            audioUrl: audioUrl,
            initialHighlights: initialHighlights
        )
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rootVC = self.bridge?.viewController else {
                call.reject("Unable to find root view controller")
                return
            }
            
            var hostingController: UIHostingController<ArtigoView>?
            
            let artigoView = ArtigoView(
                artigo: artigoData,
                onClose: {
                    hostingController?.dismiss(animated: true, completion: nil)
                },
                onHighlightsChanged: { [weak self] updatedHighlights in
                    self?.notifyListeners("onHighlightsUpdated", data: [
                        "artigoId": id,
                        "highlights": updatedHighlights
                    ])
                }
            )
            
            hostingController = UIHostingController(rootView: artigoView)
            hostingController?.modalPresentationStyle = .fullScreen
            
            if let hc = hostingController {
                rootVC.present(hc, animated: true) {
                    call.resolve()
                }
            }
        }
    }
}
