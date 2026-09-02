package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeNewsPlugin")
class NativeNewsPlugin : Plugin() {

    @PluginMethod
    fun openNewsDashboard(call: PluginCall) {
        val accessToken = call.getString("accessToken") ?: ""
        
        val intent = Intent(context, NewsActivity::class.java).apply {
            putExtra("accessToken", accessToken)
        }
        
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        
        call.resolve()
    }
}
