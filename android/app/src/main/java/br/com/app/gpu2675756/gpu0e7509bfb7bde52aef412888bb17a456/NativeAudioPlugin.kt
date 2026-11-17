package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeAudio")
class NativeAudioPlugin : Plugin() {

    private var mediaPlayerIntro: MediaPlayer? = null
    private var mediaPlayerMain: MediaPlayer? = null
    private var isIntroPlaying = false
    private var currentSpeed: Float = 1.0f
    private var currentTitle: String = "Áudio"
    private var currentAuthor: String = "Direito Prime"
    private var wakeLock: PowerManager.WakeLock? = null

    private val handler = Handler(Looper.getMainLooper())
    private val CHANNEL_ID = "app_prime_media_channel"
    private val NOTIFICATION_ID = 4040

    private val progressRunnable = object : Runnable {
        override fun run() {
            try {
                val currentMp = if (isIntroPlaying) mediaPlayerIntro else mediaPlayerMain
                if (currentMp != null && currentMp.isPlaying) {
                    val pos = (currentMp.currentPosition.coerceAtLeast(0)) / 1000.0
                    val dur = (currentMp.duration.coerceAtLeast(0)) / 1000.0
                    val data = JSObject().apply {
                        put("currentTime", pos)
                        put("duration", dur)
                        put("isPlaying", true)
                        put("trackIndex", if (isIntroPlaying) 0 else 1)
                    }
                    notifyListeners("onTimeUpdate", data)
                }
            } catch (_: Exception) {
            }
            handler.postDelayed(this, 1000L)
        }
    }

    override fun load() {
        super.load()
        createNotificationChannel()
        try {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "APP_PRIME::NativeAudioLock")
            wakeLock?.setReferenceCounted(false)
        } catch (_: Exception) {
        }
    }

    @PluginMethod
    fun prepare(call: PluginCall) {
        val introUrl = call.getString("introUrl")
        val mainUrl = call.getString("mainUrl")
        currentTitle = call.getString("title") ?: "Áudio"
        currentAuthor = call.getString("author") ?: "Direito Prime"
        currentSpeed = call.getDouble("speed")?.toFloat() ?: 1.0f

        if (mainUrl.isNullOrBlank()) {
            call.reject("Invalid Main URL")
            return
        }

        try {
            cleanupPlayers()

            if (!introUrl.isNullOrBlank()) {
                isIntroPlaying = true
                mediaPlayerIntro = createMediaPlayer(introUrl) {
                    isIntroPlaying = false
                    startMainPlayer()
                }
            } else {
                isIntroPlaying = false
            }

            mediaPlayerMain = createMediaPlayer(mainUrl) {
                // Ao terminar a faixa principal
                stopProgressTimer()
                updateNotification(false)
                releaseWakeLock()
                notifyListeners("onEnded", JSObject())
            }

            showNotification(currentTitle, currentAuthor, isPlaying = false)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Error setting up Native Audio: ${e.message}")
        }
    }

    private fun createMediaPlayer(url: String, onComplete: () -> Unit): MediaPlayer {
        return MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build()
            )
            setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK)
            setDataSource(url)
            prepareAsync()
            setOnPreparedListener {
                applySpeed(this, currentSpeed)
            }
            setOnCompletionListener {
                onComplete()
            }
        }
    }

    private fun startMainPlayer() {
        try {
            mediaPlayerMain?.start()
            applySpeed(mediaPlayerMain, currentSpeed)
            acquireWakeLock()
            startProgressTimer()
            updateNotification(isPlaying = true)
        } catch (_: Exception) {}
    }

    @PluginMethod
    fun play(call: PluginCall) {
        try {
            val mp = if (isIntroPlaying) mediaPlayerIntro else mediaPlayerMain
            mp?.start()
            applySpeed(mp, currentSpeed)
            acquireWakeLock()
            startProgressTimer()
            updateNotification(isPlaying = true)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Error playing: ${e.message}")
        }
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        try {
            mediaPlayerIntro?.pause()
            mediaPlayerMain?.pause()
            stopProgressTimer()
            releaseWakeLock()
            updateNotification(isPlaying = false)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Error pausing: ${e.message}")
        }
    }

    @PluginMethod
    fun seek(call: PluginCall) {
        val time = call.getDouble("time") ?: 0.0
        try {
            if (!isIntroPlaying) {
                mediaPlayerMain?.seekTo((time * 1000).toInt())
            }
            call.resolve()
        } catch (e: Exception) {
            call.reject("Error seeking: ${e.message}")
        }
    }

    @PluginMethod
    fun setSpeed(call: PluginCall) {
        val speed = call.getDouble("speed")?.toFloat() ?: 1.0f
        currentSpeed = speed
        try {
            val mp = if (isIntroPlaying) mediaPlayerIntro else mediaPlayerMain
            applySpeed(mp, currentSpeed)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Error setting speed: ${e.message}")
        }
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        try {
            cleanupPlayers()
            stopProgressTimer()
            releaseWakeLock()
            cancelNotification()
            call.resolve()
        } catch (e: Exception) {
            call.reject("Error stopping: ${e.message}")
        }
    }

    @PluginMethod
    fun getProgress(call: PluginCall) {
        val ret = JSObject()
        val currentMp = if (isIntroPlaying) mediaPlayerIntro else mediaPlayerMain
        val pos = ((currentMp?.currentPosition ?: 0).coerceAtLeast(0)) / 1000.0
        val dur = ((currentMp?.duration ?: 0).coerceAtLeast(0)) / 1000.0
        val playing = currentMp?.isPlaying ?: false

        ret.put("currentTime", pos)
        ret.put("duration", dur)
        ret.put("isPlaying", playing)
        ret.put("trackIndex", if (isIntroPlaying) 0 else 1)
        call.resolve(ret)
    }

    private fun applySpeed(mp: MediaPlayer?, speed: Float) {
        if (mp != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                if (mp.isPlaying) {
                    val params = PlaybackParams().apply {
                        this.speed = speed
                    }
                    mp.playbackParams = params
                }
            } catch (_: Exception) {}
        }
    }

    private fun startProgressTimer() {
        handler.removeCallbacks(progressRunnable)
        handler.post(progressRunnable)
    }

    private fun stopProgressTimer() {
        handler.removeCallbacks(progressRunnable)
    }

    private fun acquireWakeLock() {
        try {
            if (wakeLock?.isHeld == false) {
                wakeLock?.acquire(3 * 60 * 60 * 1000L) // 3 horas de garantia contínua
            }
        } catch (_: Exception) {}
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (_: Exception) {}
    }

    private fun cleanupPlayers() {
        try {
            mediaPlayerIntro?.stop()
            mediaPlayerIntro?.release()
            mediaPlayerIntro = null
        } catch (_: Exception) {}

        try {
            mediaPlayerMain?.stop()
            mediaPlayerMain?.release()
            mediaPlayerMain = null
        } catch (_: Exception) {}
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Reprodução de Áudio"
            val descriptionText = "Controle de áudio em segundo plano"
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
            }
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showNotification(title: String, author: String, isPlaying: Boolean) {
        try {
            val notificationIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            )

            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle(title)
                .setContentText(author)
                .setContentIntent(pendingIntent)
                .setOngoing(isPlaying)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW)

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(NOTIFICATION_ID, builder.build())
        } catch (_: Exception) {}
    }

    private fun updateNotification(isPlaying: Boolean) {
        showNotification(currentTitle, currentAuthor, isPlaying)
    }

    private fun cancelNotification() {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancel(NOTIFICATION_ID)
        } catch (_: Exception) {}
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        cleanupPlayers()
        stopProgressTimer()
        releaseWakeLock()
        cancelNotification()
    }
}
