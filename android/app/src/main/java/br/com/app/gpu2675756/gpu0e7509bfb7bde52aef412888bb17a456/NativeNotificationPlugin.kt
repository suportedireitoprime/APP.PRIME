package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Build
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

    @PluginMethod
    fun showProgressNotification(call: PluginCall) {
        val id = call.getInt("id", 77101) ?: 77101
        val title = call.getString("title", "Estudos Jurídicos") ?: "Estudos Jurídicos"
        val body = call.getString("body", "") ?: ""
        val progress = call.getInt("progress", 0) ?: 0
        val showProgress = call.getBoolean("showProgress", true) ?: true
        val coverUrl = call.getString("coverUrl", "") ?: ""
        val smallIconName = call.getString("smallIcon", "notification_icon") ?: "notification_icon"
        val iconColorHex = call.getString("iconColor", "#EA580C") ?: "#EA580C"
        val actionTitle = call.getString("actionTitle", "Continuar assistindo") ?: "Continuar assistindo"
        val route = call.getString("route", "/") ?: "/"
        val channelId = call.getString("channelId", "retencao_video") ?: "retencao_video"
        val channelName = call.getString("channelName", "Continuar Assistindo & Retenção") ?: "Continuar Assistindo & Retenção"
        val delaySeconds = call.getInt("delaySeconds", 0) ?: 0

        val ctx = context

        if (delaySeconds > 0) {
            // Agenda via AlarmManager para disparar com tela bloqueada ou app minimizado
            scheduleDelayedNotification(
                ctx = ctx,
                delaySeconds = delaySeconds,
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

            call.resolve(JSObject().apply {
                put("success", true)
                put("id", id)
                put("progress", progress)
                put("scheduled", true)
                put("delaySeconds", delaySeconds)
            })
            return
        }

        // Disparo imediato em thread secundária para carregar imagem sem travar a UI
        thread {
            try {
                val coverLoaded = dispatchNotification(
                    ctx = ctx,
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

                call.resolve(JSObject().apply {
                    put("success", true)
                    put("id", id)
                    put("progress", progress)
                    put("coverLoaded", coverLoaded)
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
            val ctx = context
            val notificationManager = NotificationManagerCompat.from(ctx)
            notificationManager.cancel(id)

            // Cancela também se houver alarme agendado no AlarmManager
            try {
                val intent = Intent(ctx, NotificationBroadcastReceiver::class.java)
                val pendingIntent = PendingIntent.getBroadcast(
                    ctx,
                    id + 5000,
                    intent,
                    PendingIntent.FLAG_NO_CREATE or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
                if (pendingIntent != null) {
                    val alarmManager = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                    alarmManager.cancel(pendingIntent)
                    pendingIntent.cancel()
                }
            } catch (_: Exception) {}
        }
        call.resolve(JSObject().apply { put("success", true) })
    }

    companion object {
        fun dispatchNotification(
            ctx: Context,
            id: Int,
            title: String,
            body: String,
            progress: Int,
            showProgress: Boolean,
            coverUrl: String,
            smallIconName: String,
            iconColorHex: String,
            actionTitle: String,
            route: String,
            channelId: String,
            channelName: String
        ): Boolean {
            val bitmap = loadCoverBitmap(ctx, coverUrl)
            createNotificationChannel(ctx, channelId, channelName)

            // Resolve ícone pequeno (chama oficial branca sobre transparente)
            var smallIconResId = ctx.resources.getIdentifier(smallIconName, "drawable", ctx.packageName)
            if (smallIconResId == 0) {
                smallIconResId = ctx.resources.getIdentifier("notification_icon", "drawable", ctx.packageName)
            }
            if (smallIconResId == 0) {
                smallIconResId = R.mipmap.ic_launcher
            }

            // Cor do círculo de fundo do ícone (#EA580C laranja chama por padrão)
            val iconColor = try {
                Color.parseColor(iconColorHex)
            } catch (_: Exception) {
                Color.parseColor("#EA580C")
            }

            // Intent de clique no corpo da notificação -> abre MainActivity na rota correspondente
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

            // 1. BARRA DE PROGRESSO AZUL NATIVA (estilo streaming/leitura contínua)
            if (showProgress && progress in 1..100) {
                builder.setProgress(100, progress, false)
            }

            // 2. CAPA QUADRADA À DIREITA (LARGE ICON THUMBNAIL)
            // IMPORTANTE: NÃO usar BigPictureStyle para não substituir/ocultar a barra de progresso no Android
            if (bitmap != null) {
                builder.setLargeIcon(bitmap)
            }

            // 3. BOTÃO DE AÇÃO DIRETA ("Continuar assistindo" / "Continuar lendo")
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
            notificationManager.notify(id, builder.build())
            return bitmap != null
        }

        fun scheduleDelayedNotification(
            ctx: Context,
            delaySeconds: Int,
            id: Int,
            title: String,
            body: String,
            progress: Int,
            showProgress: Boolean,
            coverUrl: String,
            smallIconName: String,
            iconColorHex: String,
            actionTitle: String,
            route: String,
            channelId: String,
            channelName: String
        ) {
            val intent = Intent(ctx, NotificationBroadcastReceiver::class.java).apply {
                putExtra("id", id)
                putExtra("title", title)
                putExtra("body", body)
                putExtra("progress", progress)
                putExtra("showProgress", showProgress)
                putExtra("coverUrl", coverUrl)
                putExtra("smallIcon", smallIconName)
                putExtra("iconColor", iconColorHex)
                putExtra("actionTitle", actionTitle)
                putExtra("route", route)
                putExtra("channelId", channelId)
                putExtra("channelName", channelName)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                ctx,
                id + 5000,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            )

            val alarmManager = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val triggerAtMillis = System.currentTimeMillis() + (delaySeconds * 1000L)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
            }
        }

        fun createNotificationChannel(ctx: Context, channelId: String, channelName: String) {
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

        fun loadCoverBitmap(ctx: Context, coverUrl: String): Bitmap? {
            if (coverUrl.isBlank()) return null

            try {
                // 1. Caso Base64
                if (coverUrl.startsWith("data:image")) {
                    val base64Data = coverUrl.substringAfter(",")
                    val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                }

                // 2. Normaliza caminhos de assets locais
                var cleanPath = coverUrl
                if (cleanPath.contains("localhost/")) {
                    cleanPath = cleanPath.substringAfter("localhost/")
                }
                cleanPath = cleanPath.trimStart('/')

                // 3. Tenta carregar diretamente dos assets locais empacotados no APK
                val assetPathsToTry = listOf(
                    "public/$cleanPath",
                    cleanPath,
                    "public/covers/$cleanPath",
                    "covers/$cleanPath"
                )

                for (path in assetPathsToTry) {
                    try {
                        ctx.assets.open(path).use { stream ->
                            val bmp = BitmapFactory.decodeStream(stream)
                            if (bmp != null) return bmp
                        }
                    } catch (_: Exception) {}
                }

                // 4. Caso URL Web Real (HTTP / HTTPS externa de CDN ou Supabase)
                if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
                    if (!coverUrl.contains("localhost") && !coverUrl.contains("127.0.0.1") && !coverUrl.contains("10.0.2.2")) {
                        val conn = URL(coverUrl).openConnection() as HttpURLConnection
                        conn.connectTimeout = 4000
                        conn.readTimeout = 4000
                        conn.doInput = true
                        conn.connect()
                        conn.inputStream.use { input ->
                            val bmp = BitmapFactory.decodeStream(input)
                            if (bmp != null) return bmp
                        }
                    }
                }

                // 5. Caso Drawable do sistema ou resId
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
}
