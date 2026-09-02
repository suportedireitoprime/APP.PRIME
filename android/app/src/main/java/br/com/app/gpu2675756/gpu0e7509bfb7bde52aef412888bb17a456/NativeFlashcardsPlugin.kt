package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeFlashcardsPlugin")
class NativeFlashcardsPlugin : Plugin() {

    @PluginMethod
    fun openDashboard(call: PluginCall) {
        val userId = call.getString("userId") ?: ""
        
        val intent = Intent(context, FlashcardsActivity::class.java).apply {
            putExtra("userId", userId)
        }
        
        // Flags to open the activity correctly over the webview
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        
        call.resolve()
    }

    @PluginMethod
    fun startStudySession(call: PluginCall) {
        val category = call.getString("category") ?: ""
        // Pass cards as JSON string
        val cardsJson = call.getArray("cards")?.toString() ?: "[]"
        
        val intent = Intent(context, FlashcardsActivity::class.java).apply {
            putExtra("category", category)
            putExtra("cards", cardsJson)
            putExtra("isStudySession", true)
        }
        
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        
        call.resolve()
    }
}
