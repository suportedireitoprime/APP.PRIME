package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlin.concurrent.thread

/**
 * BroadcastReceiver para disparar notificações agendadas com precisão via AlarmManager,
 * garantindo que a notificação com barra de progresso e capa seja exibida mesmo se o app
 * for minimizado ou o aparelho estiver com tela bloqueada.
 */
class NotificationBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getIntExtra("id", 77101)
        val title = intent.getStringExtra("title") ?: "Estudos Jurídicos"
        val body = intent.getStringExtra("body") ?: ""
        val progress = intent.getIntExtra("progress", 0)
        val showProgress = intent.getBooleanExtra("showProgress", true)
        val coverUrl = intent.getStringExtra("coverUrl") ?: ""
        val smallIconName = intent.getStringExtra("smallIcon") ?: "notification_icon"
        val iconColorHex = intent.getStringExtra("iconColor") ?: "#EA580C"
        val actionTitle = intent.getStringExtra("actionTitle") ?: "Continuar assistindo"
        val route = intent.getStringExtra("route") ?: "/"
        val channelId = intent.getStringExtra("channelId") ?: "retencao_video"
        val channelName = intent.getStringExtra("channelName") ?: "Continuar Assistindo & Retenção"

        thread {
            try {
                NativeNotificationPlugin.dispatchNotification(
                    ctx = context,
                    id = id,
                    title = title,
                    body = body,
                    progress = progress,
                    showProgress = showProgress,
                    coverUrl = coverUrl,
                    smallIconName = smallIconName,
                    iconColorHex = iconColorHex,
                    actionTitle = actionTitle,
                    route = route,
                    channelId = channelId,
                    channelName = channelName
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
