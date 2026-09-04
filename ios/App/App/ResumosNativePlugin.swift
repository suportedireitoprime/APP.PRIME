import Foundation
import Capacitor
import SwiftUI

@objc(ResumosNativePlugin)
public class ResumosNativePlugin: CAPPlugin {

    @objc func openResumos(_ call: CAPPluginCall) {
        let initialArea = call.getString("initialArea")
        let payload = call.getString("payload")

        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let resumosView = ResumosView(initialArea: initialArea, initialTema: nil, payload: payload, isReader: false) {
                    viewController.dismiss(animated: true, completion: nil)
                }
                
                let hostingController = UIHostingController(rootView: resumosView)
                hostingController.modalPresentationStyle = .fullScreen
                
                viewController.present(hostingController, animated: true, completion: nil)
            }
        }
        
        call.resolve([
            "success": true
        ])
    }

    @objc func openReader(_ call: CAPPluginCall) {
        let area = call.getString("area")
        let tema = call.getString("tema")
        let payload = call.getString("payload")

        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let resumosView = ResumosView(initialArea: area, initialTema: tema, payload: payload, isReader: true) {
                    viewController.dismiss(animated: true, completion: nil)
                }
                
                let hostingController = UIHostingController(rootView: resumosView)
                hostingController.modalPresentationStyle = .fullScreen
                
                viewController.present(hostingController, animated: true, completion: nil)
            }
        }
        
        call.resolve([
            "success": true
        ])
    }
}
