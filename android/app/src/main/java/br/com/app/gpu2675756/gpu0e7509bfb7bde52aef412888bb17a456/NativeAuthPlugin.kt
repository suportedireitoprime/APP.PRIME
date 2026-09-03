package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.app.Activity
import android.content.Intent
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeAuth")
class NativeAuthPlugin : Plugin() {

    @PluginMethod
    fun openAuth(call: PluginCall) {
        val mode = call.getString("mode") ?: "login"
        try {
            val act = activity ?: context as? Activity
            if (act == null) {
                val ret = JSObject().apply { put("success", false) }
                call.resolve(ret)
                return
            }
            val intent = Intent(act, AuthNativeActivity::class.java).apply {
                putExtra("mode", mode)
            }
            startActivityForResult(call, intent, "handleAuthResult")
        } catch (e: Exception) {
            val ret = JSObject().apply {
                put("success", false)
                put("error", e.message ?: "Falha ao abrir AuthNativeActivity")
            }
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun openLanding(call: PluginCall) {
        try {
            val act = activity ?: context as? Activity
            if (act == null) {
                val ret = JSObject().apply { put("success", false) }
                call.resolve(ret)
                return
            }
            val intent = Intent(act, LandingNativeActivity::class.java)
            startActivityForResult(call, intent, "handleLandingResult")
        } catch (e: Exception) {
            val ret = JSObject().apply {
                put("success", false)
                put("error", e.message ?: "Falha ao abrir LandingNativeActivity")
            }
            call.resolve(ret)
        }
    }

    @ActivityCallback
    private fun handleAuthResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return

        if (result.resultCode == Activity.RESULT_OK) {
            val session = result.data?.getStringExtra("session") ?: "{}"
            val ret = JSObject().apply {
                put("success", true)
                put("session", JSObject(session))
            }
            notifyListeners("onAuthSuccess", ret)
            call.resolve(ret)
        } else {
            val ret = JSObject().apply {
                put("success", false)
                put("cancelled", true)
            }
            call.resolve(ret)
        }
    }

    @ActivityCallback
    private fun handleLandingResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return

        if (result.resultCode == Activity.RESULT_OK) {
            val session = result.data?.getStringExtra("session")
            if (!session.isNullOrBlank()) {
                val ret = JSObject().apply {
                    put("success", true)
                    put("session", JSObject(session))
                }
                notifyListeners("onAuthSuccess", ret)
                call.resolve(ret)
                return
            }
        }
        val ret = JSObject().apply {
            put("success", false)
        }
        call.resolve(ret)
    }
}
