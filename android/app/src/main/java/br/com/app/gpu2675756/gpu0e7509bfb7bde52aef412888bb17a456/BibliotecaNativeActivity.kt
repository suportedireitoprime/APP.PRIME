package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.BibliotecaScreen

class BibliotecaNativeActivity : ComponentActivity() {

    companion object {
        var activeActivity: BibliotecaNativeActivity? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        activeActivity = this

        val initialAba = intent.getStringExtra("aba") ?: "acervos"
        val initialMateria = intent.getStringExtra("materia") ?: ""
        val initialLivroId = intent.getStringExtra("livroId") ?: ""
        val accessToken = intent.getStringExtra("accessToken") ?: ""

        setContent {
            BibliotecaScreen(
                initialAba = initialAba,
                initialMateria = initialMateria,
                initialLivroId = initialLivroId,
                accessToken = accessToken,
                onClose = {
                    NativeBibliotecaPlugin.instance?.emitClose()
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
