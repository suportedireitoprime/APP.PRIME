package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import android.annotation.SuppressLint
import android.view.HapticFeedbackConstants
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

data class NativeVideoaulaModel(
    val id: String,
    val videoId: String,
    val titulo: String,
    val area: String,
    val duracaoSegundos: Int = 1800,
    val descricao: String = ""
)

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun VideoaulaPlayerScreen(
    aula: NativeVideoaulaModel,
    playlist: List<NativeVideoaulaModel> = emptyList(),
    onSelectAula: (NativeVideoaulaModel) -> Unit,
    onProgressUpdate: (tempo: Int, duracao: Int, concluida: Boolean) -> Unit,
    onBack: () -> Unit
) {
    val view = LocalView.current
    var isConcluida by remember { mutableStateOf(false) }
    var showDescricaoCompleta by remember { mutableStateOf(false) }

    BackHandler {
        onBack()
    }

    Scaffold(
        containerColor = Color(0xFF0D0D0D),
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                        onBack()
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .background(Color(0xFF18181B), CircleShape)
                        .border(1.dp, Color(0xFF27272A), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Voltar",
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = aula.area.uppercase(),
                        color = Color(0xFFF59E0B),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = aula.titulo,
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── PLAYER 16:9 NATIVO ACELERADO ─────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(16f / 9f)
                        .background(Color.Black)
                ) {
                    AndroidView(
                        factory = { ctx ->
                            WebView(ctx).apply {
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                                settings.javaScriptEnabled = true
                                settings.domStorageEnabled = true
                                settings.mediaPlaybackRequiresUserGesture = false
                                settings.cacheMode = WebSettings.LOAD_DEFAULT
                                webChromeClient = WebChromeClient()
                                webViewClient = WebViewClient()

                                val embedHtml = """
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                        <style>
                                            * { margin: 0; padding: 0; box-sizing: border-box; }
                                            body, html { width: 100%; height: 100%; background-color: #000; overflow: hidden; }
                                            iframe { width: 100%; height: 100%; border: none; }
                                        </style>
                                    </head>
                                    <body>
                                        <iframe 
                                            src="https://www.youtube.com/embed/${aula.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowfullscreen>
                                        </iframe>
                                    </body>
                                    </html>
                                """.trimIndent()

                                loadDataWithBaseURL("https://www.youtube.com", embedHtml, "text/html", "UTF-8", null)
                            }
                        },
                        update = { webView ->
                            val embedHtml = """
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                    <style>
                                        * { margin: 0; padding: 0; box-sizing: border-box; }
                                        body, html { width: 100%; height: 100%; background-color: #000; overflow: hidden; }
                                        iframe { width: 100%; height: 100%; border: none; }
                                    </style>
                                </head>
                                <body>
                                    <iframe 
                                        src="https://www.youtube.com/embed/${aula.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowfullscreen>
                                    </iframe>
                                </body>
                                </html>
                            """.trimIndent()
                            webView.loadDataWithBaseURL("https://www.youtube.com", embedHtml, "text/html", "UTF-8", null)
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            // ── INFORMAÇÕES DA AULA & AÇÕES ───────────────────────────────
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = aula.titulo,
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        lineHeight = 24.sp
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0xFF1F2937),
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            Text(
                                text = aula.area,
                                color = Color(0xFFA1A1AA),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }

                        Text(
                            text = "• 30 min",
                            color = Color(0xFF71717A),
                            fontSize = 12.sp
                        )
                    }

                    // Botões de Ação
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                isConcluida = !isConcluida
                                onProgressUpdate(aula.duracaoSegundos, aula.duracaoSegundos, isConcluida)
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isConcluida) Color(0xFF36AF85) else Color(0xFF27272A)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp)
                        ) {
                            Icon(
                                imageVector = if (isConcluida) Icons.Default.CheckCircle else Icons.Default.Check,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (isConcluida) "Concluída" else "Marcar Concluída",
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        OutlinedButton(
                            onClick = {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                            border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(Color(0xFF27272A))),
                            modifier = Modifier.height(46.dp)
                        ) {
                            Icon(Icons.Default.BookmarkBorder, contentDescription = "Salvar", modifier = Modifier.size(18.dp))
                        }
                    }

                    if (aula.descricao.isNotBlank()) {
                        Text(
                            text = aula.descricao,
                            color = Color(0xFFA1A1AA),
                            fontSize = 13.sp,
                            lineHeight = 18.sp,
                            maxLines = if (showDescricaoCompleta) Int.MAX_VALUE else 2,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.clickable { showDescricaoCompleta = !showDescricaoCompleta }
                        )
                    }
                }
            }

            // ── TRILHA DE AULAS DA DISCIPLINA ─────────────────────────────
            if (playlist.isNotEmpty()) {
                item {
                    Text(
                        text = "AULAS DA DISCIPLINA",
                        color = Color(0xFFA1A1AA),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }

                items(playlist) { itemAula ->
                    val isCurrent = itemAula.id == aula.id
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                onSelectAula(itemAula)
                            }
                            .background(if (isCurrent) Color(0xFF1E1E24) else Color.Transparent)
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(if (isCurrent) Color(0xFFF59E0B) else Color(0xFF27272A)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isCurrent) Icons.Default.PlayArrow else Icons.Default.OndemandVideo,
                                contentDescription = null,
                                tint = if (isCurrent) Color.Black else Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = itemAula.titulo,
                                color = if (isCurrent) Color(0xFFF59E0B) else Color.White,
                                fontSize = 14.sp,
                                fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "Vídeo • 30 min",
                                color = Color(0xFF71717A),
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
