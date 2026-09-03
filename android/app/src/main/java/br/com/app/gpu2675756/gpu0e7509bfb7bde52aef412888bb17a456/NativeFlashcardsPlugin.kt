package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeFlashcardsPlugin")
class NativeFlashcardsPlugin : Plugin() {

    companion object {
        var instance: NativeFlashcardsPlugin? = null
        var currentCardsJson: String = "[]"
        var currentSessionTitle: String = "Flashcards"
        var currentStartIndex: Int = 0
    }

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun openSession(call: PluginCall) {
        val titulo = call.getString("titulo") ?: "Flashcards"
        val cardsArray = call.getArray("cards")?.toString() ?: "[]"
        val startIndex = call.getInt("startIndex", 0) ?: 0

        currentSessionTitle = titulo
        currentCardsJson = cardsArray
        currentStartIndex = startIndex

        val intent = Intent(context, FlashcardsNativeActivity::class.java).apply {
            putExtra("titulo", titulo)
            putExtra("startIndex", startIndex)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        context.startActivity(intent)
        call.resolve(JSObject().apply { put("success", true) })
    }

    @PluginMethod
    fun closeSession(call: PluginCall) {
        FlashcardsNativeActivity.activeActivity?.finish()
        call.resolve(JSObject().apply { put("success", true) })
    }

    fun emitCardAnswered(cardId: String, status: String, area: String, tema: String) {
        val ret = JSObject().apply {
            put("cardId", cardId)
            put("status", status)
            put("area", area)
            put("tema", tema)
        }
        notifyListeners("onCardAnswered", ret)
    }

    fun emitSessionCompleted(total: Int, compreendidos: Int, revisar: Int) {
        val ret = JSObject().apply {
            put("total", total)
            put("compreendidos", compreendidos)
            put("revisar", revisar)
        }
        notifyListeners("onSessionCompleted", ret)
    }

    fun emitClose() {
        notifyListeners("onClose", JSObject())
    }
}
