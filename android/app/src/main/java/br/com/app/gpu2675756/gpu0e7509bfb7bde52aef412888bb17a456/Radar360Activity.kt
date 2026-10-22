package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.Radar360Screen

class Radar360Activity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val accessToken = intent.getStringExtra("accessToken") ?: ""
        val itemsJson = intent.getStringExtra("itemsJson") ?: "[]"
        
        setContent {
            Radar360Screen(
                accessToken = accessToken,
                initialItemsJson = itemsJson,
                onClose = { finish() }
            )
        }
    }
}
