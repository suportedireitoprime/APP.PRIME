import Capacitor
import UIKit

@objc(NativePilulasPlugin)
public class NativePilulasPlugin: CAPPlugin {
    
    public override func load() {
        // Plugin loaded
    }

    @objc func openPilulasDashboard(_ call: CAPPluginCall) {
        let accessToken = call.getString("accessToken") ?? ""
        let startPilulaId = call.getString("startPilulaId") ?? ""
        
        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let pilulasVC = PilulasHostingController(accessToken: accessToken, startPilulaId: startPilulaId)
                pilulasVC.modalPresentationStyle = .fullScreen
                viewController.present(pilulasVC, animated: true, completion: nil)
            } else {
                call.reject("Could not find view controller")
            }
        }
        
        call.resolve()
    }
}
