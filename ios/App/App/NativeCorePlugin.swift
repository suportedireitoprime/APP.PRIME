import Foundation
import Capacitor

@objc(NativeCorePlugin)
public class NativeCorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeCorePlugin"
    public let jsName = "NativeCore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise)
    ]

    @objc func initialize(_ call: CAPPluginCall) {
        let message = call.getString("message") ?? ""

        print("[NativeCorePlugin] Initialize called with message: \(message)")
        
        call.resolve([
            "success": true,
            "platform": "ios",
            "message_received": message
        ])
    }
}
