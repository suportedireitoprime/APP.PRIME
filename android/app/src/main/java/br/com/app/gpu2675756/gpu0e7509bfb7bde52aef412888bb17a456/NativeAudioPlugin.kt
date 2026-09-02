package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.media.AudioAttributes
import android.media.MediaPlayer
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeAudio")
class NativeAudioPlugin : Plugin() {

    private var mediaPlayerIntro: MediaPlayer? = null
    private var mediaPlayerMain: MediaPlayer? = null
    private var isIntroPlaying = true

    @PluginMethod
    fun prepare(call: PluginCall) {
        val introUrl = call.getString("introUrl")
        val mainUrl = call.getString("mainUrl")

        if (introUrl == null || mainUrl == null) {
            call.reject("Invalid URLs")
            return
        }

        try {
            mediaPlayerIntro?.release()
            mediaPlayerMain?.release()

            mediaPlayerIntro = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setDataSource(introUrl)
                prepareAsync()
            }

            mediaPlayerMain = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setDataSource(mainUrl)
                prepareAsync()
            }

            // Quando a intro terminar, toca a principal
            mediaPlayerIntro?.setOnCompletionListener {
                isIntroPlaying = false
                mediaPlayerMain?.start()
            }

            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Error setting up MediaPlayer: ${e.message}")
        }
    }

    @PluginMethod
    fun play(call: PluginCall) {
        if (isIntroPlaying) {
            mediaPlayerIntro?.start()
        } else {
            mediaPlayerMain?.start()
        }
        call.resolve()
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        if (isIntroPlaying) {
            mediaPlayerIntro?.pause()
        } else {
            mediaPlayerMain?.pause()
        }
        call.resolve()
    }

    @PluginMethod
    fun seek(call: PluginCall) {
        val time = call.getDouble("time") ?: 0.0
        if (!isIntroPlaying) {
            mediaPlayerMain?.seekTo((time * 1000).toInt())
        }
        call.resolve()
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        mediaPlayerIntro?.stop()
        mediaPlayerMain?.stop()
        call.resolve()
    }

    @PluginMethod
    fun getProgress(call: PluginCall) {
        val ret = JSObject()
        if (isIntroPlaying) {
            ret.put("currentTime", (mediaPlayerIntro?.currentPosition ?: 0) / 1000.0)
            ret.put("duration", (mediaPlayerIntro?.duration ?: 0) / 1000.0)
            ret.put("isPlaying", mediaPlayerIntro?.isPlaying ?: false)
            ret.put("trackIndex", 0)
        } else {
            ret.put("currentTime", (mediaPlayerMain?.currentPosition ?: 0) / 1000.0)
            ret.put("duration", (mediaPlayerMain?.duration ?: 0) / 1000.0)
            ret.put("isPlaying", mediaPlayerMain?.isPlaying ?: false)
            ret.put("trackIndex", 1)
        }
        call.resolve(ret)
    }
}
