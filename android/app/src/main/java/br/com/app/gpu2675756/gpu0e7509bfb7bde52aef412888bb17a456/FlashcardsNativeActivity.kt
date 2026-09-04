package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.FlashcardsScreen
import org.json.JSONArray

class FlashcardsNativeActivity : ComponentActivity() {

    companion object {
        var activeActivity: FlashcardsNativeActivity? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        activeActivity = this

        val titulo = intent.getStringExtra("titulo") ?: "Flashcards"
        val startIndex = intent.getIntExtra("startIndex", 0)

        val cardsJson = NativeFlashcardsPlugin.currentCardsJson
        val jsonArray = try { JSONArray(cardsJson) } catch (e: Exception) { JSONArray() }
        
        val cardsList = mutableListOf<FlashcardModel>()
        for (i in 0 until jsonArray.length()) {
            val obj = jsonArray.optJSONObject(i) ?: continue
            cardsList.add(
                FlashcardModel(
                    id = obj.optString("id"),
                    pergunta = obj.optString("pergunta"),
                    resposta = obj.optString("resposta"),
                    area = obj.optString("area", "Direito"),
                    tema = obj.optString("tema", ""),
                    subtema = obj.optString("subtema", ""),
                    exemplo = obj.optString("exemplo", ""),
                    baseLegal = obj.optString("base_legal", ""),
                    dica = obj.optString("dica", ""),
                    artigoNumero = obj.optString("artigo_numero", "")
                )
            )
        }

        val mode = intent.getStringExtra("mode") ?: if (cardsList.isNotEmpty()) "session" else "hub"

        setContent {
            var currentMode by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(mode) }
            var activeTitulo by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(titulo) }
            var activeCards by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(cardsList) }

            if (currentMode == "session" && activeCards.isNotEmpty()) {
                FlashcardsScreen(
                    titulo = activeTitulo,
                    initialCards = activeCards,
                    startIndex = startIndex,
                    onCardAnswered = { cardId, status, area, tema ->
                        NativeFlashcardsPlugin.instance?.emitCardAnswered(cardId, status, area, tema)
                    },
                    onSessionCompleted = { total, compreendidos, revisar ->
                        NativeFlashcardsPlugin.instance?.emitSessionCompleted(total, compreendidos, revisar)
                    },
                    onClose = {
                        if (mode == "hub") {
                            // Voltar para o Hub se o usuário entrou pelo Hub
                            currentMode = "hub"
                        } else {
                            NativeFlashcardsPlugin.instance?.emitClose()
                            finish()
                        }
                    }
                )
            } else {
                br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.FlashcardsHubScreen(
                    onStartSession = { sessaoTitulo, cards ->
                        activeTitulo = sessaoTitulo
                        activeCards = cards
                        currentMode = "session"
                    },
                    onBack = {
                        NativeFlashcardsPlugin.instance?.emitClose()
                        finish()
                    }
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (activeActivity == this) {
            activeActivity = null
        }
    }
}

data class FlashcardModel(
    val id: String,
    val pergunta: String,
    val resposta: String,
    val area: String,
    val tema: String = "",
    val subtema: String = "",
    val exemplo: String = "",
    val baseLegal: String = "",
    val dica: String = "",
    val artigoNumero: String = ""
)
