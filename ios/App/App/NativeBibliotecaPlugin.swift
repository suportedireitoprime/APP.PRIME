import Capacitor
import SwiftUI

@objc(NativeBibliotecaPlugin)
public class NativeBibliotecaPlugin: CAPPlugin {
    
    private var hostingController: UIViewController?

    @objc func openBiblioteca(_ call: CAPPluginCall) {
        let aba = call.getString("aba") ?? "acervos"
        let materia = call.getString("materia") ?? ""
        let livroId = call.getString("livroId") ?? ""
        let accessToken = call.getString("accessToken") ?? ""

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let rootVC = self.bridge?.viewController else {
                call.reject("Unable to find root view controller")
                return
            }

            let bibliotecaView = BibliotecaView(
                initialAba: aba,
                initialMateria: materia,
                initialLivroId: livroId,
                accessToken: accessToken,
                onClose: { [weak self] in
                    self?.hostingController?.dismiss(animated: true) {
                        self?.notifyListeners("onClose", data: [:])
                    }
                }
            )

            let hostingVC = UIHostingController(rootView: bibliotecaView)
            hostingVC.modalPresentationStyle = .fullScreen
            self.hostingController = hostingVC

            rootVC.present(hostingVC, animated: true) {
                call.resolve()
            }
        }
    }

    @objc func closeBiblioteca(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.hostingController?.dismiss(animated: true) {
                self?.notifyListeners("onClose", data: [:])
                call.resolve()
            }
        }
    }
}
