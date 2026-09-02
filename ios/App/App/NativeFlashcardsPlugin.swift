import Capacitor

@objc(NativeFlashcardsPlugin)
public class NativeFlashcardsPlugin: CAPPlugin {
    
    public static var shared: NativeFlashcardsPlugin?
    
    public override func load() {
        NativeFlashcardsPlugin.shared = self
    }

    @objc func openDashboard(_ call: CAPPluginCall) {
        let userId = call.getString("userId") ?? ""
        let accessToken = call.getString("accessToken") ?? ""
        
        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let flashcardsVC = FlashcardsHostingController(isStudySession: false, category: "", accessToken: accessToken)
                flashcardsVC.modalPresentationStyle = .fullScreen
                viewController.present(flashcardsVC, animated: true, completion: nil)
            }
        }
        call.resolve()
    }
    
    @objc func startStudySession(_ call: CAPPluginCall) {
        let category = call.getString("category") ?? ""
        let accessToken = call.getString("accessToken") ?? ""
        
        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let flashcardsVC = FlashcardsHostingController(isStudySession: true, category: category, accessToken: accessToken) { revisados, total in
                    let resultData: [String: Any] = [
                        "cardsRevisados": revisados,
                        "totalCards": total
                    ]
                    call.resolve(["result": resultData])
                }
                flashcardsVC.modalPresentationStyle = .fullScreen
                viewController.present(flashcardsVC, animated: true, completion: nil)
            } else {
                call.reject("Could not find view controller")
            }
        }
    }
}
