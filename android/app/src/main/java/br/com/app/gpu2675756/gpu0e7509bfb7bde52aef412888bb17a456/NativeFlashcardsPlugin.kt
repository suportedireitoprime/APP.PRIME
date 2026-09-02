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
        val accessToken = call.getString("accessToken") ?: ""
        
        val intent = Intent(context, FlashcardsActivity::class.java).apply {
            putExtra("userId", userId)
            putExtra("accessToken", accessToken)
        }
        
        // Flags to open the activity correctly over the webview
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        
        call.resolve()
    }

    @PluginMethod
    fun startStudySession(call: PluginCall) {
        val category = call.getString("category") ?: ""
        val cardsJson = call.getArray("cards")?.toString() ?: "[]"
        val accessToken = call.getString("accessToken") ?: ""
        
        val intent = Intent(context, FlashcardsActivity::class.java).apply {
            putExtra("category", category)
            putExtra("cards", cardsJson)
            putExtra("accessToken", accessToken)
            putExtra("isStudySession", true)
        }
        
        startActivityForResult(call, intent, "studySessionResult")
    }

    @com.getcapacitor.annotation.ActivityCallback
    private fun studySessionResult(call: PluginCall?, result: androidx.activity.result.ActivityResult) {
        if (call == null) return
        
        val data = result.data
        val cardsRevisados = data?.getIntExtra("cardsRevisados", 1) ?: 1
        val totalCards = data?.getIntExtra("totalCards", 10) ?: 10
        
        val retObj = JSObject()
        retObj.put("cardsRevisados", cardsRevisados)
        retObj.put("totalCards", totalCards)
        
        val finalResult = JSObject()
        finalResult.put("result", retObj)
        
        call.resolve(finalResult)
    }
}
