import Capacitor

@objc(NativeFlashcardsPlugin)
public class NativeFlashcardsPlugin: CAPPlugin {
    
    public static var shared: NativeFlashcardsPlugin?
    
    public override func load() {
        NativeFlashcardsPlugin.shared = self
    }

    @objc func openDashboard(_ call: CAPPluginCall) {
        let userId = call.getString("userId") ?? ""
        
        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let flashcardsVC = FlashcardsHostingController(isStudySession: false, category: "")
                flashcardsVC.modalPresentationStyle = .fullScreen
                viewController.present(flashcardsVC, animated: true, completion: nil)
            }
        }
        call.resolve()
    }
    
    @objc func startStudySession(_ call: CAPPluginCall) {
        let category = call.getString("category") ?? ""
        // Let's assume cards are passed as JSON string or array, simplified here.
        
        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let flashcardsVC = FlashcardsHostingController(isStudySession: true, category: category)
                flashcardsVC.modalPresentationStyle = .fullScreen
                viewController.present(flashcardsVC, animated: true, completion: nil)
            }
        }
        call.resolve()
    }
}
