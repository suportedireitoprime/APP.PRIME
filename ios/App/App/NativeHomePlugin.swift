import Capacitor
import SwiftUI

@objc(NativeHomePlugin)
public class NativeHomePlugin: CAPPlugin {
    
    private var homeHostingController: UIHostingController<HomeView>?
    
    @objc func showHome(_ call: CAPPluginCall) {
        let data = call.getObject("data") ?? [:]
        let nome = data["nome"] as? String ?? "Usuário"
        let perfilLabel = data["perfilLabel"] as? String ?? "Estudante"
        let unreadCount = data["unreadCount"] as? Int ?? 0
        
        DispatchQueue.main.async {
            if let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }),
               let rootViewController = window.rootViewController {
                
                let homeView = HomeView(
                    nome: nome,
                    perfilLabel: perfilLabel,
                    unreadCount: unreadCount,
                    onNavigate: { [weak self] route in
                        self?.notifyListeners("onNavigate", data: ["route": route])
                        self?.dismissHome()
                    },
                    onSearch: { [weak self] in
                        self?.notifyListeners("onSearch", data: [:])
                        self?.dismissHome()
                    },
                    onOpenSidebar: { [weak self] in
                        self?.notifyListeners("onOpenSidebar", data: [:])
                        self?.dismissHome()
                    },
                    onOpenNotifications: { [weak self] in
                        self?.notifyListeners("onOpenNotifications", data: [:])
                        self?.dismissHome()
                    }
                )
                
                let hostingController = UIHostingController(rootView: homeView)
                hostingController.modalPresentationStyle = .fullScreen
                
                self.homeHostingController = hostingController
                rootViewController.present(hostingController, animated: true)
                
                // Do not resolve call immediately so it stays active if needed
            } else {
                call.reject("Could not find root view controller")
            }
        }
    }
    
    @objc func hideHome(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.dismissHome()
            call.resolve()
        }
    }
    
    private func dismissHome() {
        self.homeHostingController?.dismiss(animated: true)
        self.homeHostingController = nil
    }
}
