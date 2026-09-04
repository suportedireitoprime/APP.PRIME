package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.ResumosScreen

class ResumosActivity : ComponentActivity() {

    companion object {
        var activeActivity: ResumosActivity? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        activeActivity = this

        val initialArea = intent.getStringExtra("initialArea")
        val area = intent.getStringExtra("area")
        val tema = intent.getStringExtra("tema")
        val payload = intent.getStringExtra("payload")
        val isReader = intent.getBooleanExtra("isReader", false)

        setContent {
            ResumosScreen(
                initialArea = initialArea ?: area,
                initialTema = tema,
                payload = payload,
                isReader = isReader,
                onBack = { finish() }
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
