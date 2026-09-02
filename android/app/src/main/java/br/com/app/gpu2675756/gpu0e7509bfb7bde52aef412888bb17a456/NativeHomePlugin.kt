package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeHome")
class NativeHomePlugin : Plugin() {

    companion object {
        var activeCall: PluginCall? = null
        var instance: NativeHomePlugin? = null
    }

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun showHome(call: PluginCall) {
        val data = call.getObject("data")
        val nome = data?.getString("nome") ?: "Usuário"
        val iniciais = data?.getString("iniciais") ?: ""
        val perfilLabel = data?.getString("perfilLabel") ?: "Estudante"
        val avatarUrl = data?.getString("avatarUrl") ?: ""
        val unreadCount = data?.getInteger("unreadCount") ?: 0

        activeCall = call

        val intent = Intent(context, NativeHomeActivity::class.java).apply {
            putExtra("nome", nome)
            putExtra("iniciais", iniciais)
            putExtra("perfilLabel", perfilLabel)
            putExtra("avatarUrl", avatarUrl)
            putExtra("unreadCount", unreadCount)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        
        context.startActivity(intent)
        // Não resolvemos a call imediatamente, deixamos a activity aberta
    }

    @PluginMethod
    fun hideHome(call: PluginCall) {
        // Envia um broadcast ou finaliza a activity nativa
        val intent = Intent("br.com.app.CLOSE_NATIVE_HOME")
        context.sendBroadcast(intent)
        call.resolve()
    }

    fun emitNavigate(route: String) {
        val ret = JSObject()
        ret.put("route", route)
        notifyListeners("onNavigate", ret)
    }

    fun emitSearch() {
        notifyListeners("onSearch", JSObject())
    }

    fun emitOpenSidebar() {
        notifyListeners("onOpenSidebar", JSObject())
    }

    fun emitOpenNotifications() {
        notifyListeners("onOpenNotifications", JSObject())
    }
}
