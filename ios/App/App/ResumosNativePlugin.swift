import Foundation
import Capacitor
import SwiftUI

@objc(ResumosNativePlugin)
public class ResumosNativePlugin: CAPPlugin {

    private func extractPayloadString(_ call: CAPPluginCall) -> String {
        if let str = call.getString("payload") {
            return str
        }
        if let arr = call.getArray("payload") {
            if let data = try? JSONSerialization.data(withJSONObject: arr, options: []),
               let str = String(data: data, encoding: .utf8) {
                return str
            }
        }
        if let dict = call.getObject("payload") {
            if let data = try? JSONSerialization.data(withJSONObject: dict, options: []),
               let str = String(data: data, encoding: .utf8) {
                return str
            }
        }
        return "[]"
    }

    @objc func openResumos(_ call: CAPPluginCall) {
        let initialArea = call.getString("initialArea")
        let initialTema = call.getString("initialTema")
        let payloadString = extractPayloadString(call)

        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let resumosView = ResumosView(
                    initialArea: initialArea,
                    initialTema: initialTema,
                    payload: payloadString,
                    isReader: false
                ) {
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
        let payloadString = extractPayloadString(call)

        DispatchQueue.main.async {
            if let viewController = self.bridge?.viewController {
                let resumosView = ResumosView(
                    initialArea: area,
                    initialTema: tema,
                    payload: payloadString,
                    isReader: true
                ) {
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
