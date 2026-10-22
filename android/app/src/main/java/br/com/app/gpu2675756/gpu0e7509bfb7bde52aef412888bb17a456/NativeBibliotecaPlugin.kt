package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeBibliotecaPlugin")
class NativeBibliotecaPlugin : Plugin() {

    companion object {
        var instance: NativeBibliotecaPlugin? = null
    }

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun openBiblioteca(call: PluginCall) {
        val aba = call.getString("aba") ?: "acervos"
        val materia = call.getString("materia") ?: ""
        val livroId = call.getString("livroId") ?: ""
        val accessToken = call.getString("accessToken") ?: ""

        val intent = Intent(context, BibliotecaNativeActivity::class.java).apply {
            putExtra("aba", aba)
            putExtra("materia", materia)
            putExtra("livroId", livroId)
            putExtra("accessToken", accessToken)
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)

        call.resolve()
    }

    @PluginMethod
    fun closeBiblioteca(call: PluginCall) {
        BibliotecaNativeActivity.activeActivity?.finish()
        call.resolve()
    }

    fun emitClose() {
        notifyListeners("onClose", JSObject())
    }
}
