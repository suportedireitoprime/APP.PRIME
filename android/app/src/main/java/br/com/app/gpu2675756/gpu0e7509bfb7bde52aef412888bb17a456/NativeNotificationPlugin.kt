package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Base64
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

@CapacitorPlugin(name = "NativeNotification")
class NativeNotificationPlugin : Plugin() {

    private val mainHandler = Handler(Looper.getMainLooper())

    @PluginMethod
    fun showProgressNotification(call: PluginCall) {
        val id = call.getInt("id", 77101) ?: 77101
        val title = call.getString("title", "Estudos Jurídicos") ?: "Estudos Jurídicos"
        val body = call.getString("body", "") ?: ""
        val progress = call.getInt("progress", 0) ?: 0
        val showProgress = call.getBoolean("showProgress", true) ?: true
        val coverUrl = call.getString("coverUrl", "") ?: ""
        val smallIconName = call.getString("smallIcon", "notification_icon") ?: "notification_icon"
        val iconColorHex = call.getString("iconColor", "#2563EB") ?: "#2563EB"
        val actionTitle = call.getString("actionTitle", "Continuar assistindo") ?: "Continuar assistindo"
        val route = call.getString("route", "/") ?: "/"
        val channelId = call.getString("channelId", "retencao_video") ?: "retencao_video"
        val channelName = call.getString("channelName", "Continuar Assistindo & Retenção") ?: "Continuar Assistindo & Retenção"
        val delaySeconds = call.getInt("delaySeconds", 0) ?: 0

        // Executa em thread separada para decodificar ou baixar imagem sem travar a UI
        thread {
            try {
                val ctx = context
                val bitmap = loadCoverBitmap(ctx, coverUrl)

                // Garante a criação do canal com alta importância (pop-up / heads-up)
                createNotificationChannel(ctx, channelId, channelName)

                // Resolve ícone pequeno
                var smallIconResId = ctx.resources.getIdentifier(smallIconName, "drawable", ctx.packageName)
                if (smallIconResId == 0) {
                    smallIconResId = ctx.resources.getIdentifier("notification_icon", "drawable", ctx.packageName)
                }
                if (smallIconResId == 0) {
                    smallIconResId = R.mipmap.ic_launcher
                }

                // Cor do ícone
                val iconColor = try {
                    Color.parseColor(iconColorHex)
                } catch (_: Exception) {
                    Color.parseColor("#2563EB")
                }

                // Intent ao clicar na notificação
                val contentIntent = Intent(ctx, MainActivity::class.java).apply {
                    action = Intent.ACTION_VIEW
                    flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("route", route)
                    putExtra("notificationId", id)
                    putExtra("action", "clique_corpo")
                }
                val contentPendingIntent = PendingIntent.getActivity(
                    ctx,
                    id,
                    contentIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )

                // Construtor da Notificação
                val builder = NotificationCompat.Builder(ctx, channelId)
                    .setSmallIcon(smallIconResId)
                    .setColor(iconColor)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setContentIntent(contentPendingIntent)
                    .setAutoCancel(true)
                    .setOngoing(false)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)

                // Barra de progresso azul contínua (estilo Netflix/YouTube)
                if (showProgress && progress in 1..100) {
                    builder.setProgress(100, progress, false)
                }

                // Capa do livro ou videoaula
                if (bitmap != null) {
                    builder.setLargeIcon(bitmap)
                    // Ao expandir a gaveta de notificações, exibe o banner completo
                    builder.setStyle(
                        NotificationCompat.BigPictureStyle()
                            .bigPicture(bitmap)
                            .bigLargeIcon(null as Bitmap?) // esconde o ícone secundário duplicado na expansão
                            .setSummaryText(body)
                    )
                }

                // Botão de ação direta na notificação ("Continuar assistindo" / "Continuar lendo")
                if (actionTitle.isNotBlank()) {
                    val actionIntent = Intent(ctx, MainActivity::class.java).apply {
                        action = Intent.ACTION_VIEW
                        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                        putExtra("route", route)
                        putExtra("notificationId", id)
                        putExtra("action", "continuar")
                    }
                    val actionPendingIntent = PendingIntent.getActivity(
                        ctx,
                        id + 1000,
                        actionIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                    )
                    builder.addAction(smallIconResId, actionTitle, actionPendingIntent)
                }

                val notificationManager = NotificationManagerCompat.from(ctx)

                // Disparo com delay ou imediato
                if (delaySeconds > 0) {
                    mainHandler.postDelayed({
                        try {
                            notificationManager.notify(id, builder.build())
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }, delaySeconds * 1000L)
                } else {
                    mainHandler.post {
                        try {
                            notificationManager.notify(id, builder.build())
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }

                call.resolve(JSObject().apply {
                    put("success", true)
                    put("id", id)
                    put("progress", progress)
                    put("coverLoaded", bitmap != null)
                })
            } catch (e: Exception) {
                e.printStackTrace()
                call.reject("Erro ao disparar notificação nativa: ${e.message}", e)
            }
        }
    }

    @PluginMethod
    fun cancelNotification(call: PluginCall) {
        val id = call.getInt("id", 0) ?: 0
        if (id > 0) {
            val notificationManager = NotificationManagerCompat.from(context)
            notificationManager.cancel(id)
        }
        call.resolve(JSObject().apply { put("success", true) })
    }

    private fun createNotificationChannel(ctx: Context, channelId: String, channelName: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val existing = notificationManager.getNotificationChannel(channelId)
            if (existing == null) {
                val channel = NotificationChannel(
                    channelId,
                    channelName,
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notificações com progresso de estudos e áudio"
                    enableLights(true)
                    enableVibration(true)
                    setShowBadge(true)
                }
                notificationManager.createNotificationChannel(channel)
            }
        }
    }

    private fun loadCoverBitmap(ctx: Context, coverUrl: String): Bitmap? {
        if (coverUrl.isBlank()) return null

        try {
            // 1. Caso Base64
            if (coverUrl.startsWith("data:image")) {
                val base64Data = coverUrl.substringAfter(",")
                val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                return BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            }

            // 2. Caso URL Web (HTTP / HTTPS)
            if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
                val conn = URL(coverUrl).openConnection() as HttpURLConnection
                conn.connectTimeout = 4000
                conn.readTimeout = 4000
                conn.doInput = true
                conn.connect()
                val input: InputStream = conn.inputStream
                val bmp = BitmapFactory.decodeStream(input)
                input.close()
                return bmp
            }

            // 3. Caso Asset Local do App (Capacitor assets/public/...)
            val cleanPath = coverUrl.trimStart('/')
            val assetPathsToTry = listOf(
                "public/$cleanPath",
                cleanPath,
                "public/covers/$cleanPath",
                "covers/$cleanPath"
            )

            for (path in assetPathsToTry) {
                try {
                    val stream = ctx.assets.open(path)
                    val bmp = BitmapFactory.decodeStream(stream)
                    stream.close()
                    if (bmp != null) return bmp
                } catch (_: Exception) {}
            }

            // 4. Caso Drawable pelo nome
            val resId = ctx.resources.getIdentifier(cleanPath.substringBeforeLast('.'), "drawable", ctx.packageName)
            if (resId != 0) {
                return BitmapFactory.decodeResource(ctx.resources, resId)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return null
    }
}
