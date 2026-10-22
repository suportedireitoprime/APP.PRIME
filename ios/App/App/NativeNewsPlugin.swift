import Capacitor

@objc(NativeNewsPlugin)
public class NativeNewsPlugin: CAPPlugin {
    
    public override func load() {
        // Plugin loaded
    }

    @objc func openNewsDashboard(_ call: CAPPluginCall) {
        let accessToken = call.getString("accessToken") ?? ""
        
        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let newsVC = NewsHostingController(accessToken: accessToken)
                newsVC.modalPresentationStyle = .fullScreen
                viewController.present(newsVC, animated: true, completion: nil)
            } else {
                call.reject("Could not find view controller")
            }
        }
        
        call.resolve()
    }
}
