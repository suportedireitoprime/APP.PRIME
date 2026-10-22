package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeVadeMecumPlugin")
class NativeVadeMecumPlugin : Plugin() {

    companion object {
        var activeCall: PluginCall? = null
        var instance: NativeVadeMecumPlugin? = null
    }

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun openArtigo(call: PluginCall) {
        val id = call.getString("id") ?: ""
        val numero = call.getString("numero") ?: ""
        val caput = call.getString("caput") ?: ""
        val titulo = call.getString("titulo") ?: ""
        val tabelaNome = call.getString("tabelaNome") ?: ""
        val paragrafos = call.getArray("paragrafos")?.toString() ?: "[]"
        val incisos = call.getArray("incisos")?.toString() ?: "[]"
        val highlights = call.getArray("highlights")?.toString() ?: "[]"
        val audioUrl = call.getString("audioUrl") ?: ""
        val accessToken = call.getString("accessToken") ?: ""

        activeCall = call

        val intent = Intent(context, ArtigoNativeActivity::class.java).apply {
            putExtra("id", id)
            putExtra("numero", numero)
            putExtra("caput", caput)
            putExtra("titulo", titulo)
            putExtra("tabelaNome", tabelaNome)
            putExtra("paragrafos", paragrafos)
            putExtra("incisos", incisos)
            putExtra("highlights", highlights)
            putExtra("audioUrl", audioUrl)
            putExtra("accessToken", accessToken)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        context.startActivity(intent)
        call.resolve()
    }

    fun emitHighlightsUpdated(artigoId: String, highlightsJson: String) {
        val ret = JSObject().apply {
            put("artigoId", artigoId)
            put("highlights", highlightsJson)
        }
        notifyListeners("onHighlightsUpdated", ret)
    }
}
