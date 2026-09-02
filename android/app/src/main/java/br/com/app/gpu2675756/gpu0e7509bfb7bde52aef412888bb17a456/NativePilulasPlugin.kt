package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativePilulasPlugin")
class NativePilulasPlugin : Plugin() {

    @PluginMethod
    fun openPilulasDashboard(call: PluginCall) {
        val accessToken = call.getString("accessToken") ?: ""
        val startPilulaId = call.getString("startPilulaId") ?: ""
        
        val intent = Intent(context, PilulasActivity::class.java).apply {
            putExtra("accessToken", accessToken)
            putExtra("startPilulaId", startPilulaId)
        }
        
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        
        call.resolve()
    }
}
