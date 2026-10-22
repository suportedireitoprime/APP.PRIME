package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeMeExpliquePlugin")
class NativeMeExpliquePlugin : Plugin() {

    private var torchEnabled = false

    @PluginMethod
    fun verificarPermissoes(call: PluginCall) {
        val cameraGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED

        val audioGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        val ret = JSObject().apply {
            put("camera", cameraGranted)
            put("microfone", audioGranted)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun alternarLanterna(call: PluginCall) {
        try {
            val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
            val cameraId = cameraManager?.cameraIdList?.firstOrNull()
            if (cameraId != null) {
                torchEnabled = !torchEnabled
                cameraManager.setTorchMode(cameraId, torchEnabled)
                val ret = JSObject().apply {
                    put("ligada", torchEnabled)
                }
                call.resolve(ret)
            } else {
                call.reject("Câmera com flash não encontrada")
            }
        } catch (e: Exception) {
            call.reject("Erro ao alternar lanterna: ${e.message}")
        }
    }

    @PluginMethod
    fun vibrarFeedback(call: PluginCall) {
        val tipo = call.getString("tipo") ?: "click"
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                val vibrator = vibratorManager?.defaultVibrator
                val effect = if (tipo == "heavy") {
                    VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK)
                } else {
                    VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
                }
                vibrator?.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                @Suppress("DEPRECATION")
                vibrator?.vibrate(if (tipo == "heavy") 50 else 20)
            }
            call.resolve()
        } catch (e: Exception) {
            call.resolve()
        }
    }
}
