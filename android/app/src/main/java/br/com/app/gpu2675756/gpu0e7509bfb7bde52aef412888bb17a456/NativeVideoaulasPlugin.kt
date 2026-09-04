package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeVideoaulasPlugin")
class NativeVideoaulasPlugin : Plugin() {

    companion object {
        var instance: NativeVideoaulasPlugin? = null
    }

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun openHub(call: PluginCall) {
        val intent = Intent(context, VideoaulasNativeActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        call.resolve(JSObject().apply { put("success", true) })
    }

    @PluginMethod
    fun openVideo(call: PluginCall) {
        val videoId = call.getString("videoId") ?: ""
        val titulo = call.getString("titulo") ?: "Videoaula"
        val area = call.getString("area") ?: "Direito"
        val descricao = call.getString("descricao") ?: ""

        val intent = Intent(context, VideoaulasNativeActivity::class.java).apply {
            putExtra("videoId", videoId)
            putExtra("titulo", titulo)
            putExtra("area", area)
            putExtra("descricao", descricao)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        call.resolve(JSObject().apply { put("success", true) })
    }

    @PluginMethod
    fun closeVideo(call: PluginCall) {
        VideoaulasNativeActivity.activeActivity?.finish()
        call.resolve(JSObject().apply { put("success", true) })
    }

    fun emitVideoProgress(videoId: String, tempo: Int, duracao: Int, concluida: Boolean) {
        val ret = JSObject().apply {
            put("videoId", videoId)
            put("tempo", tempo)
            put("duracao", duracao)
            put("concluida", concluida)
        }
        notifyListeners("onVideoProgress", ret)
    }

    fun emitClose() {
        notifyListeners("onClose", JSObject())
    }
}
