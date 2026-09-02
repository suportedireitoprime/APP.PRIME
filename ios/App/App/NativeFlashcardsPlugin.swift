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
                let flashcardsVC = FlashcardsHostingController(isStudySession: true, category: category, accessToken: accessToken)
                flashcardsVC.modalPresentationStyle = .fullScreen
                viewController.present(flashcardsVC, animated: true, completion: nil)
            }
        }
        call.resolve()
    }
}
