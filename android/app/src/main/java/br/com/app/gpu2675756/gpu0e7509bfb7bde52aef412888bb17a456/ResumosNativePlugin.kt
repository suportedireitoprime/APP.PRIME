package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "ResumosNativePlugin")
class ResumosNativePlugin : Plugin() {

    companion object {
        var instance: ResumosNativePlugin? = null
        var currentPayloadJson: String = "[]"
    }

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun openResumos(call: PluginCall) {
        val initialArea = call.getString("initialArea")
        val initialTema = call.getString("initialTema")
        val payloadRaw = call.getArray("payload")?.toString()
            ?: call.getObject("payload")?.toString()
            ?: call.getString("payload")
            ?: call.data.opt("payload")?.toString()
            ?: "[]"

        currentPayloadJson = payloadRaw

        val intent = Intent(context, ResumosActivity::class.java).apply {
            putExtra("initialArea", initialArea)
            putExtra("initialTema", initialTema)
            putExtra("isReader", false)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        
        context.startActivity(intent)

        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun openReader(call: PluginCall) {
        val area = call.getString("area")
        val tema = call.getString("tema")
        val payloadRaw = call.getArray("payload")?.toString()
            ?: call.getObject("payload")?.toString()
            ?: call.getString("payload")
            ?: call.data.opt("payload")?.toString()
            ?: "[]"

        currentPayloadJson = payloadRaw

        val intent = Intent(context, ResumosActivity::class.java).apply {
            putExtra("area", area)
            putExtra("tema", tema)
            putExtra("isReader", true)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        
        context.startActivity(intent)

        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }
}
