package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeCore")
public class NativeCorePlugin extends Plugin {

    @PluginMethod
    public void initialize(PluginCall call) {
        String message = call.getString("message", "");
        
        // Em um cenário real, aqui seria o ponto de entrada para lógica nativa pesada,
        // inicialização de SDKs de fundo, Workers nativos, etc.
        System.out.println("[NativeCorePlugin] Initialize called with message: " + message);

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("platform", "android");
        ret.put("message_received", message);
        call.resolve(ret);
    }
}
