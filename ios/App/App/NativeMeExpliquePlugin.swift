import Capacitor
import AVFoundation
import UIKit

@objc(NativeMeExpliquePlugin)
public class NativeMeExpliquePlugin: CAPPlugin {
    
    private var torchEnabled = false

    @objc func verificarPermissoes(_ call: CAPPluginCall) {
        let videoStatus = AVCaptureDevice.authorizationStatus(for: .video)
        let audioStatus = AVCaptureDevice.authorizationStatus(for: .audio)
        
        call.resolve([
            "camera": videoStatus == .authorized,
            "microfone": audioStatus == .authorized
        ])
    }

    @objc func alternarLanterna(_ call: CAPPluginCall) {
        guard let device = AVCaptureDevice.default(for: .video), device.hasTorch else {
            call.reject("Flash/Lanterna indisponível neste dispositivo")
            return
        }
        
        do {
            try device.lockForConfiguration()
            torchEnabled = !torchEnabled
            device.torchMode = torchEnabled ? .on : .off
            device.unlockForConfiguration()
            
            call.resolve([
                "ligada": torchEnabled
            ])
        } catch {
            call.reject("Erro ao alternar lanterna: \(error.localizedDescription)")
        }
    }

    @objc func vibrarFeedback(_ call: CAPPluginCall) {
        let tipo = call.getString("tipo") ?? "click"
        DispatchQueue.main.async {
            if tipo == "heavy" {
                UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            } else {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
            call.resolve()
        }
    }
}
