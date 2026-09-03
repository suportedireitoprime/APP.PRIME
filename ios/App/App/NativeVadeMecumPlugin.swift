import Capacitor

@objc(NativeVadeMecumPlugin)
public class NativeVadeMecumPlugin: CAPPlugin {
    
    public override func load() {
        // Plugin loaded
    }

    @objc func openArtigo(_ call: CAPPluginCall) {
        // No Android é executada a ArtigoNativeActivity (Jetpack Compose).
        // No iOS ou quando indisponível, o fallback web permanece ativo.
        call.resolve()
    }
}
