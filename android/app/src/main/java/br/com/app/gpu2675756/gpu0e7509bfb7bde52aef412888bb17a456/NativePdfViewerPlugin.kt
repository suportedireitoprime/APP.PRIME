package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativePdfViewer")
class NativePdfViewerPlugin : Plugin() {

    @PluginMethod
    fun openPdf(call: PluginCall) {
        val url = call.getString("url")
        val title = call.getString("title") ?: "Documento PDF"
        val initialPage = call.getInt("initialPage") ?: 1
        val isDarkMode = call.getBoolean("isDarkMode") ?: false

        if (url.isNullOrBlank()) {
            call.reject("URL do PDF não pode ser vazia")
            return
        }

        try {
            val intent = Intent(context, PdfViewerActivity::class.java).apply {
                putExtra("pdf_url", url)
                putExtra("pdf_title", title)
                putExtra("initial_page", initialPage)
                putExtra("is_dark_mode", isDarkMode)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Erro ao abrir visualizador nativo: ${e.message}")
        }
    }
}
