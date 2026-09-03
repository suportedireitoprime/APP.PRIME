import Capacitor
import UIKit
import SwiftUI

@objc(NativeAuthPlugin)
public class NativeAuthPlugin: CAPPlugin {

    @objc func openAuth(_ call: CAPPluginCall) {
        let mode = call.getString("mode") ?? "login"

        DispatchQueue.main.async {
            guard let bridge = self.bridge, let viewController = bridge.viewController else {
                call.reject("ViewController indisponível")
                return
            }

            var hostingController: UIHostingController<AuthView>?

            let authView = AuthView(
                initialMode: mode,
                onSuccess: { sessionJson in
                    hostingController?.dismiss(animated: true) {
                        let ret: [String: Any] = [
                            "success": true,
                            "session": sessionJson
                        ]
                        self.notifyListeners("onAuthSuccess", data: ret)
                        call.resolve(ret)
                    }
                },
                onClose: {
                    hostingController?.dismiss(animated: true) {
                        call.resolve(["success": false])
                    }
                }
            )

            hostingController = UIHostingController(rootView: authView)
            hostingController?.modalPresentationStyle = .fullScreen
            if let host = hostingController {
                viewController.present(host, animated: true)
            }
        }
    }

    @objc func openLanding(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let bridge = self.bridge, let viewController = bridge.viewController else {
                call.reject("ViewController indisponível")
                return
            }

            var hostingController: UIHostingController<LandingView>?

            let landingView = LandingView(
                onOpenAuth: { mode in
                    let authView = AuthView(
                        initialMode: mode,
                        onSuccess: { sessionJson in
                            hostingController?.dismiss(animated: true) {
                                let ret: [String: Any] = [
                                    "success": true,
                                    "session": sessionJson
                                ]
                                self.notifyListeners("onAuthSuccess", data: ret)
                                call.resolve(ret)
                            }
                        },
                        onClose: {
                            // Voltar para a landing
                        }
                    )
                    let authHost = UIHostingController(rootView: authView)
                    authHost.modalPresentationStyle = .fullScreen
                    hostingController?.present(authHost, animated: true)
                },
                onClose: {
                    hostingController?.dismiss(animated: true) {
                        call.resolve(["success": false])
                    }
                }
            )

            hostingController = UIHostingController(rootView: landingView)
            hostingController?.modalPresentationStyle = .fullScreen
            if let host = hostingController {
                viewController.present(host, animated: true)
            }
        }
    }
}
