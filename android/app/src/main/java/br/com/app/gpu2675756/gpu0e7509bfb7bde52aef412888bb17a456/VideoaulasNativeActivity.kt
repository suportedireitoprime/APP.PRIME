package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.NativeVideoaulaModel
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.VideoaulaPlayerScreen
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.VideoaulasHubScreen

class VideoaulasNativeActivity : ComponentActivity() {

    companion object {
        var activeActivity: VideoaulasNativeActivity? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        activeActivity = this

        val initialVideoId = intent.getStringExtra("videoId")
        val initialTitulo = intent.getStringExtra("titulo") ?: "Videoaula"
        val initialArea = intent.getStringExtra("area") ?: "Direito"
        val initialDescricao = intent.getStringExtra("descricao") ?: ""

        val hasInitialVideo = !initialVideoId.isNullOrBlank()

        setContent {
            var currentScreen by remember { mutableStateOf(if (hasInitialVideo) "player" else "hub") }
            var currentAula by remember {
                mutableStateOf(
                    if (hasInitialVideo) {
                        NativeVideoaulaModel(
                            id = "aula_initial",
                            videoId = initialVideoId ?: "",
                            titulo = initialTitulo,
                            area = initialArea,
                            descricao = initialDescricao
                        )
                    } else null
                )
            }
            var currentPlaylist by remember { mutableStateOf<List<NativeVideoaulaModel>>(emptyList()) }

            if (currentScreen == "player" && currentAula != null) {
                VideoaulaPlayerScreen(
                    aula = currentAula!!,
                    playlist = currentPlaylist,
                    onSelectAula = { selected ->
                        currentAula = selected
                    },
                    onProgressUpdate = { tempo, duracao, concluida ->
                        NativeVideoaulasPlugin.instance?.emitVideoProgress(
                            currentAula!!.videoId,
                            tempo,
                            duracao,
                            concluida
                        )
                    },
                    onBack = {
                        if (hasInitialVideo && currentPlaylist.isEmpty()) {
                            NativeVideoaulasPlugin.instance?.emitClose()
                            finish()
                        } else {
                            currentScreen = "hub"
                        }
                    }
                )
            } else {
                VideoaulasHubScreen(
                    onPlayAula = { aula, playlist ->
                        currentAula = aula
                        currentPlaylist = playlist
                        currentScreen = "player"
                    },
                    onBack = {
                        NativeVideoaulasPlugin.instance?.emitClose()
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
