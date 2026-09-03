package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.view.HapticFeedbackConstants
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONArray
import java.util.Locale

data class NativeHighlight(
    val lineIndex: Int,
    val wordIndex: Int,
    val colorHex: String
)

class ArtigoNativeActivity : ComponentActivity(), TextToSpeech.OnInitListener {

    private var mediaPlayer: MediaPlayer? = null
    private var tts: TextToSpeech? = null
    private var ttsReady: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val id = intent.getStringExtra("id") ?: ""
        val numero = intent.getStringExtra("numero") ?: ""
        val caput = intent.getStringExtra("caput") ?: ""
        val titulo = intent.getStringExtra("titulo") ?: ""
        val tabelaNome = intent.getStringExtra("tabelaNome") ?: ""
        val paragrafosRaw = intent.getStringExtra("paragrafos") ?: "[]"
        val incisosRaw = intent.getStringExtra("incisos") ?: "[]"
        val audioUrl = intent.getStringExtra("audioUrl") ?: ""

        val paragrafosList = parseJsonArray(paragrafosRaw)
        val incisosList = parseJsonArray(incisosRaw)

        tts = TextToSpeech(this, this)

        setContent {
            ArtigoNativeScreen(
                id = id,
                numero = numero,
                caput = caput,
                titulo = titulo,
                tabelaNome = tabelaNome,
                paragrafos = paragrafosList,
                incisos = incisosList,
                audioUrl = audioUrl,
                onBack = { finish() },
                onPlayNarration = { textToSpeak, streamUrl ->
                    playOrSpeak(textToSpeak, streamUrl)
                },
                onStopNarration = {
                    stopAllAudio()
                }
            )
        }
    }

    private fun parseJsonArray(raw: String): List<String> {
        val list = mutableListOf<String>()
        try {
            val arr = JSONArray(raw)
            for (i in 0 until arr.length()) {
                val str = arr.optString(i)
                if (str.isNotBlank()) list.add(str)
            }
        } catch (_: Exception) {}
        return list
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale("pt", "BR")
            ttsReady = true
        }
    }

    private fun playOrSpeak(text: String, streamUrl: String) {
        stopAllAudio()
        if (streamUrl.isNotBlank()) {
            try {
                mediaPlayer = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .build()
                    )
                    setDataSource(streamUrl)
                    prepareAsync()
                    setOnPreparedListener { start() }
                }
                return
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Fallback para TTS nativo
        if (ttsReady && text.isNotBlank()) {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ArtigoTTS")
        }
    }

    private fun stopAllAudio() {
        mediaPlayer?.let {
            if (it.isPlaying) it.stop()
            it.release()
        }
        mediaPlayer = null
        tts?.stop()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopAllAudio()
        tts?.shutdown()
    }
}

@Composable
fun ArtigoNativeScreen(
    id: String,
    numero: String,
    caput: String,
    titulo: String,
    tabelaNome: String,
    paragrafos: List<String>,
    incisos: List<String>,
    audioUrl: String,
    onBack: () -> Unit,
    onPlayNarration: (text: String, audioUrl: String) -> Unit,
    onStopNarration: () -> Unit
) {
    val view = LocalView.current

    // Estado do leitor
    var fontSize by remember { mutableStateOf(16) }
    var highlightMode by remember { mutableStateOf(false) }
    var isNarrating by remember { mutableStateOf(false) }
    var selectedColor by remember { mutableStateOf("#FACC15") } // Amarelo padrão

    // Grifos persistidos por palavra (lineIndex -> wordIndex -> colorHex)
    val highlights = remember { mutableStateMapOf<String, String>() }

    // Lista de blocos do artigo (0 = caput, 1..N = paragrafos, N+1.. = incisos)
    val allBlocks = remember(caput, paragrafos, incisos) {
        val list = mutableListOf<String>()
        if (caput.isNotBlank()) list.add(caput)
        list.addAll(paragrafos)
        list.addAll(incisos)
        list
    }

    // Texto completo para narração
    val fullArticleText = remember(numero, allBlocks) {
        "Artigo $numero. " + allBlocks.joinToString(". ")
    }

    val paletteColors = listOf(
        "#FACC15" to "Amarelo",
        "#4ADE80" to "Verde",
        "#60A5FA" to "Azul",
        "#F472B6" to "Rosa",
        "#FB923C" to "Laranja"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0D0D))
            .windowInsetsPadding(WindowInsets.statusBars)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {

            // ===== TOP BAR NATIVA =====
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp)
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Botão de Voltar (Padrão 48x48dp / 52x52dp com feedback tátil)
                IconButton(
                    onClick = {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                        onBack()
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1F1F23))
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Voltar",
                        tint = Color.White
                    )
                }

                // Título Central
                Column(
                    modifier = Modifier.weight(1f).padding(horizontal = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = if (numero.isNotBlank()) "Art. $numero" else "Artigo",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFACC15)
                    )
                    if (tabelaNome.isNotBlank() || titulo.isNotBlank()) {
                        Text(
                            text = if (titulo.isNotBlank()) titulo else tabelaNome.replace("LEIS_", ""),
                            fontSize = 11.sp,
                            color = Color(0xFF9CA3AF),
                            maxLines = 1
                        )
                    }
                }

                // Controles de Ação (Tamanho da fonte + Toggle Grifo)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Alternador de tamanho de fonte
                    IconButton(
                        onClick = {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            fontSize = if (fontSize >= 22) 14 else fontSize + 2
                        },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF1F1F23))
                    ) {
                        Text(
                            text = "A",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // Botão Grifar (Modo Manual)
                    IconButton(
                        onClick = {
                            view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
                            highlightMode = !highlightMode
                        },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(if (highlightMode) Color(0xFFE11D48) else Color(0xFF1F1F23))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Grifo Manual",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // ===== BARRA DE CORES FLUTUANTE DO GRIFO =====
            AnimatedVisibility(
                visible = highlightMode,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFF18181B))
                        .border(1.dp, Color(0xFF27272A), RoundedCornerShape(16.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Cor:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF9CA3AF)
                        )
                        paletteColors.forEach { (hex, _) ->
                            val color = Color(android.graphics.Color.parseColor(hex))
                            val isSelected = selectedColor == hex
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(color)
                                    .border(
                                        width = if (isSelected) 2.dp else 0.dp,
                                        color = if (isSelected) Color.White else Color.Transparent,
                                        shape = CircleShape
                                    )
                                    .clickable {
                                        view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                                        selectedColor = hex
                                    }
                            )
                        }
                    }

                    // Botão Limpar Grifos
                    IconButton(
                        onClick = {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            highlights.clear()
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Limpar Grifos",
                            tint = Color(0xFFEF4444),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            // ===== CONTEÚDO DO ARTIGO (LEITURA E GRIFO FLUIDO) =====
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                contentPadding = PaddingValues(top = 12.dp, bottom = 100.dp)
            ) {
                // Título descritivo se houver
                if (titulo.isNotBlank()) {
                    item {
                        Text(
                            text = titulo,
                            fontSize = (fontSize - 2).sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFFE11D48),
                            fontFamily = FontFamily.Serif,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }
                }

                // Dispositivos do Artigo
                itemsIndexed(allBlocks) { blockIndex, blockText ->
                    val isFirst = blockIndex == 0
                    val isInciso = blockText.trim().matches(Regex("^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\\b.*"))
                    val isParagrafo = blockText.trim().startsWith("§") || blockText.trim().startsWith("Parágrafo único")

                    val indent = when {
                        isInciso -> 20.dp
                        isParagrafo -> 8.dp
                        else -> 0.dp
                    }

                    val words = remember(blockText) { blockText.split(Regex("\\s+")) }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = indent, bottom = 14.dp)
                    ) {
                        // Monta o texto com anotações de cor diretamente palavra por palavra
                        val annotated = buildAnnotatedString {
                            if (isFirst && numero.isNotBlank()) {
                                withStyle(
                                    SpanStyle(
                                        color = Color(0xFFE11D48),
                                        fontWeight = FontWeight.Bold
                                    )
                                ) {
                                    append("Art. $numero ")
                                }
                                withStyle(SpanStyle(color = Color(0xFF9CA3AF))) {
                                    append("— ")
                                }
                            }

                            words.forEachIndexed { wordIndex, word ->
                                val key = "$blockIndex-$wordIndex"
                                val hlHex = highlights[key]
                                if (hlHex != null) {
                                    val hlColor = Color(android.graphics.Color.parseColor(hlHex)).copy(alpha = 0.45f)
                                    withStyle(
                                        SpanStyle(
                                            background = hlColor,
                                            color = Color.White
                                        )
                                    ) {
                                        append(word)
                                    }
                                } else {
                                    withStyle(SpanStyle(color = Color(0xFFE4E4E7))) {
                                        append(word)
                                    }
                                }
                                append(" ")
                            }
                        }

                        // Text element com touch gesture fluido
                        Text(
                            text = annotated,
                            fontSize = fontSize.sp,
                            lineHeight = (fontSize * 1.7).sp,
                            fontFamily = FontFamily.Serif,
                            modifier = Modifier
                                .fillMaxWidth()
                                .pointerInput(highlightMode, selectedColor) {
                                    if (highlightMode) {
                                        detectDragGestures(
                                            onDragStart = { offset ->
                                                view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                                                val approxWordIdx = (offset.x / 40).toInt().coerceIn(0, words.size - 1)
                                                val key = "$blockIndex-$approxWordIdx"
                                                if (highlights.containsKey(key)) {
                                                    highlights.remove(key)
                                                } else {
                                                    highlights[key] = selectedColor
                                                }
                                            },
                                            onDrag = { change, _ ->
                                                change.consume()
                                                val approxWordIdx = (change.position.x / 40).toInt().coerceIn(0, words.size - 1)
                                                val key = "$blockIndex-$approxWordIdx"
                                                if (highlights[key] != selectedColor) {
                                                    view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                                                    highlights[key] = selectedColor
                                                }
                                            }
                                        )
                                    }
                                }
                        )
                    }
                }
            }

            // ===== BOTTOM NAV BAR NATIVA =====
            Surface(
                color = Color(0xFF141416),
                border = borderBrush(1.dp, Color(0xFF27272A)),
                shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .windowInsetsPadding(WindowInsets.navigationBars)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(64.dp)
                        .padding(horizontal = 24.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Botão Apagar
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                highlights.clear()
                            }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Apagar",
                            tint = Color(0xFFF87171),
                            modifier = Modifier.size(22.dp)
                        )
                        Text(
                            text = "Apagar",
                            fontSize = 11.sp,
                            color = Color(0xFFF87171)
                        )
                    }

                    // FAB Central: Narrar
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .offset(y = (-14).dp)
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFE11D48))
                            .clickable {
                                view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
                                isNarrating = !isNarrating
                                if (isNarrating) {
                                    onPlayNarration(fullArticleText, audioUrl)
                                } else {
                                    onStopNarration()
                                }
                            }
                    ) {
                        Icon(
                            imageVector = if (isNarrating) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = if (isNarrating) "Pausar" else "Narrar",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    // Botão Fechar
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                onBack()
                            }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Fechar",
                            tint = Color(0xFF9CA3AF),
                            modifier = Modifier.size(22.dp)
                        )
                        Text(
                            text = "Fechar",
                            fontSize = 11.sp,
                            color = Color(0xFF9CA3AF)
                        )
                    }
                }
            }
        }
    }
}

private fun borderBrush(width: androidx.compose.ui.unit.Dp, color: Color) =
    androidx.compose.foundation.BorderStroke(width, color)
