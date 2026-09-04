import Capacitor
import UIKit
import SwiftUI

@objc(NativeRadar360Plugin)
public class NativeRadar360Plugin: CAPPlugin {
    
    public override func load() {
        // Plugin loaded
    }

    @objc func openRadar360(_ call: CAPPluginCall) {
        let accessToken = call.getString("accessToken") ?? ""
        let itemsJson = call.getString("itemsJson") ?? "[]"
        
        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let radarView = Radar360View(
                    accessToken: accessToken,
                    initialItemsJson: itemsJson,
                    onClose: {
                        viewController.dismiss(animated: true, completion: nil)
                    }
                )
                let hostingController = UIHostingController(rootView: radarView)
                hostingController.modalPresentationStyle = .fullScreen
                viewController.present(hostingController, animated: true, completion: nil)
            } else {
                call.reject("Could not find view controller")
            }
        }
        
        call.resolve()
    }
}
