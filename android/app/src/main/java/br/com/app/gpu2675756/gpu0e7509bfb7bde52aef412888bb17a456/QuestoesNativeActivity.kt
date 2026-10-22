package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.QuestoesScreen
import org.json.JSONArray

class QuestoesNativeActivity : ComponentActivity() {

    companion object {
        var activeActivity: QuestoesNativeActivity? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        activeActivity = this

        val titulo = intent.getStringExtra("titulo") ?: "Questões"
        val startIndex = intent.getIntExtra("startIndex", 0)
        val contexto = intent.getStringExtra("contexto") ?: "pratica"

        val questoesJson = NativeQuestoesPlugin.currentQuestoesJson
        val jsonArray = try { JSONArray(questoesJson) } catch (e: Exception) { JSONArray() }
        
        val questoesList = mutableListOf<QuestaoModel>()
        for (i in 0 until jsonArray.length()) {
            val obj = jsonArray.optJSONObject(i) ?: continue
            questoesList.add(
                QuestaoModel(
                    id = obj.optString("id"),
                    enunciado = obj.optString("enunciado"),
                    altA = obj.optString("alt_a", ""),
                    altB = obj.optString("alt_b", ""),
                    altC = obj.optString("alt_c", ""),
                    altD = obj.optString("alt_d", ""),
                    altE = obj.optString("alt_e", ""),
                    gabaritoOficial = obj.optString("gabarito_oficial", "A").trim().uppercase(),
                    gabaritoComentado = obj.optString("gabarito_comentado", ""),
                    disciplina = obj.optString("disciplina", "Direito"),
                    assunto = obj.optString("assunto", ""),
                    ano = obj.optInt("ano", 2024),
                    banca = obj.optString("banca", "OAB / FGV"),
                    orgao = obj.optString("orgao", "")
                )
            )
        }

        setContent {
            QuestoesScreen(
                titulo = titulo,
                initialQuestoes = questoesList,
                startIndex = startIndex,
                contexto = contexto,
                onQuestaoAnswered = { questaoId, alternativa, acertou, tempo ->
                    NativeQuestoesPlugin.instance?.emitQuestaoAnswered(questaoId, alternativa, acertou, tempo)
                },
                onSessionCompleted = { total, acertos, erros, tempoTotal ->
                    NativeQuestoesPlugin.instance?.emitSessionCompleted(total, acertos, erros, tempoTotal)
                },
                onClose = {
                    NativeQuestoesPlugin.instance?.emitClose()
                    finish()
                }
            )
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (activeActivity == this) {
            activeActivity = null
        }
    }
}

data class QuestaoModel(
    val id: String,
    val enunciado: String,
    val altA: String,
    val altB: String,
    val altC: String,
    val altD: String,
    val altE: String = "",
    val gabaritoOficial: String,
    val gabaritoComentado: String = "",
    val disciplina: String = "",
    val assunto: String = "",
    val ano: Int = 2024,
    val banca: String = "",
    val orgao: String = ""
)
