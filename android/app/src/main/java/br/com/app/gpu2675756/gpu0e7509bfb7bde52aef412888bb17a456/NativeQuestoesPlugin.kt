package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeQuestoesPlugin")
class NativeQuestoesPlugin : Plugin() {

    companion object {
        var instance: NativeQuestoesPlugin? = null
        var currentQuestoesJson: String = "[]"
        var currentSessionTitle: String = "Questões"
        var currentStartIndex: Int = 0
        var currentContexto: String = "pratica"
    }

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun openSession(call: PluginCall) {
        val titulo = call.getString("titulo") ?: "Questões"
        val questoesArray = call.getArray("questoes")?.toString() ?: "[]"
        val startIndex = call.getInt("startIndex", 0) ?: 0
        val contexto = call.getString("contexto") ?: "pratica"

        currentSessionTitle = titulo
        currentQuestoesJson = questoesArray
        currentStartIndex = startIndex
        currentContexto = contexto

        val intent = Intent(context, QuestoesNativeActivity::class.java).apply {
            putExtra("titulo", titulo)
            putExtra("startIndex", startIndex)
            putExtra("contexto", contexto)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        context.startActivity(intent)
        call.resolve(JSObject().apply { put("success", true) })
    }

    @PluginMethod
    fun closeSession(call: PluginCall) {
        QuestoesNativeActivity.activeActivity?.finish()
        call.resolve(JSObject().apply { put("success", true) })
    }

    fun emitQuestaoAnswered(questaoId: String, alternativa: String, acertou: Boolean, tempoSegundos: Int) {
        val ret = JSObject().apply {
            put("questaoId", questaoId)
            put("alternativa", alternativa)
            put("acertou", acertou)
            put("tempoSegundos", tempoSegundos)
        }
        notifyListeners("onQuestaoAnswered", ret)
    }

    fun emitSessionCompleted(total: Int, acertos: Int, erros: Int, tempoTotalSegundos: Int) {
        val ret = JSObject().apply {
            put("total", total)
            put("acertos", acertos)
            put("erros", erros)
            put("tempoTotalSegundos", tempoTotalSegundos)
        }
        notifyListeners("onSessionCompleted", ret)
    }

    fun emitClose() {
        notifyListeners("onClose", JSObject())
    }
}
