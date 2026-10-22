package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui.HomeScreen

class NativeHomeActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val nome = intent.getStringExtra("nome") ?: "WESLEY"
        val perfilLabel = intent.getStringExtra("perfilLabel") ?: "Estudando pra OAB"
        val unreadCount = intent.getIntExtra("unreadCount", 19)

        setContent {
            HomeScreen(
                nome = nome,
                perfilLabel = perfilLabel,
                unreadCount = unreadCount,
                onNavigate = { route ->
                    NativeHomePlugin.instance?.emitNavigate(route)
                    finish()
                },
                onSearch = {
                    NativeHomePlugin.instance?.emitSearch()
                    finish()
                },
                onOpenSidebar = {
                    NativeHomePlugin.instance?.emitOpenSidebar()
                    finish()
                },
                onOpenNotifications = {
                    NativeHomePlugin.instance?.emitOpenNotifications()
                    finish()
                }
            )
        }
    }
}
