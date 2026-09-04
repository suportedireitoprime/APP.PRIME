package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "ResumosNativePlugin")
class ResumosNativePlugin : Plugin() {

    @PluginMethod
    fun openResumos(call: PluginCall) {
        val initialArea = call.getString("initialArea")
        val payload = call.getString("payload")

        val intent = Intent(context, ResumosActivity::class.java).apply {
            putExtra("initialArea", initialArea)
            putExtra("payload", payload)
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
        val payload = call.getString("payload")

        val intent = Intent(context, ResumosActivity::class.java).apply {
            putExtra("area", area)
            putExtra("tema", tema)
            putExtra("payload", payload)
            putExtra("isReader", true)
        }
        
        context.startActivity(intent)

        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }
}
