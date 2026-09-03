package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.SharedPreferences
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.view.HapticFeedbackConstants
import android.widget.Toast
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
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.platform.LocalContext
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
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class NativeJurisprudencia(
    val tribunal: String,
    val tipo: String,
    val numero: String,
    val tese: String,
    val ano: String
)

data class NativeVoiceNote(
    val id: String,
    val file: File,
    val dateString: String
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
    val context = LocalContext.current
    val view = LocalView.current

    // Abas: 0 = Artigo, 1 = Jurisprudência, 2 = Anotações & Voz
    var selectedTab by remember { mutableStateOf(0) }

    // Estado do leitor
    var fontSize by remember { mutableStateOf(16) }
    var highlightMode by remember { mutableStateOf(false) }
    var isNarrating by remember { mutableStateOf(false) }
    var selectedColor by remember { mutableStateOf("#FACC15") }
    val highlights = remember { mutableStateMapOf<String, String>() }

    // Anotações em Texto (Persistência com SharedPreferences)
    val prefs = remember { context.getSharedPreferences("app_prime_artigo_notes", Context.MODE_PRIVATE) }
    var textNote by remember { mutableStateOf(prefs.getString("note_$id", "") ?: "") }

    // Gravador de Voz Nativo (MediaRecorder)
    var isRecording by remember { mutableStateOf(false) }
    var mediaRecorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var currentRecordingFile by remember { mutableStateOf<File?>(null) }
    var voicePlayer by remember { mutableStateOf<MediaPlayer?>(null) }
    var activePlayingNoteId by remember { mutableStateOf<String?>(null) }
    var voiceNotes by remember { mutableStateOf<List<NativeVoiceNote>>(emptyList()) }

    // Função para carregar gravações do artigo
    fun loadVoiceNotes() {
        val dir = context.getExternalFilesDir(null) ?: context.filesDir
        val prefix = "voice_note_${id}_"
        val files = dir.listFiles { file -> file.name.startsWith(prefix) && file.name.endsWith(".m4a") }
        val list = files?.map { f ->
            val date = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date(f.lastModified()))
            NativeVoiceNote(f.name, f, date)
        }?.sortedByDescending { it.file.lastModified() } ?: emptyList()
        voiceNotes = list
    }

    LaunchedEffect(id) {
        loadVoiceNotes()
    }

    DisposableEffect(Unit) {
        onDispose {
            mediaRecorder?.release()
            voicePlayer?.release()
        }
    }

    val allBlocks = remember(caput, paragrafos, incisos) {
        val list = mutableListOf<String>()
        if (caput.isNotBlank()) list.add(caput)
        list.addAll(paragrafos)
        list.addAll(incisos)
        list
    }

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
                    .height(60.dp)
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(
                    onClick = {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                        onBack()
                    },
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1E1E22))
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Voltar",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Art. $numero",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    if (tabelaNome.isNotBlank()) {
                        Text(
                            text = tabelaNome.replace("_", " ").uppercase(),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFE11D48),
                            letterSpacing = 1.sp
                        )
                    }
                }

                if (selectedTab == 0) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF1E1E22))
                                .clickable {
                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                    if (fontSize > 13) fontSize -= 2
                                }
                        ) {
                            Text("A-", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF1E1E22))
                                .clickable {
                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                    if (fontSize < 26) fontSize += 2
                                }
                        ) {
                            Text("A+", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                } else {
                    Spacer(modifier = Modifier.size(70.dp))
                }
            }

            // ===== SELETOR DE ABAS NATIVO =====
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("Artigo", "Jurisprudência", "Anotações & Voz").forEachIndexed { index, title ->
                    val isSelected = selectedTab == index
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) Color(0xFFE11D48) else Color(0xFF1E1E22))
                            .clickable {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                selectedTab = index
                            }
                            .padding(vertical = 8.dp)
                    ) {
                        Text(
                            text = title,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.White else Color(0xFF9CA3AF)
                        )
                    }
                }
            }

            // ===== CONTEÚDO DA ABA SELECIONADA =====
            when (selectedTab) {
                // ABA 0: ARTIGO
                0 -> {
                    Box(modifier = Modifier.weight(1f)) {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 20.dp),
                            contentPadding = PaddingValues(top = 12.dp, bottom = 100.dp)
                        ) {
                            if (titulo.isNotBlank()) {
                                item {
                                    Text(
                                        text = titulo,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF9CA3AF),
                                        modifier = Modifier.padding(bottom = 12.dp)
                                    )
                                }
                            }

                            itemsIndexed(allBlocks) { blockIndex, blockText ->
                                val words = remember(blockText) { blockText.split(Regex("\\s+")).filter { it.isNotBlank() } }
                                val annotated = buildAnnotatedString {
                                    if (blockIndex == 0) {
                                        withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = Color(0xFFE11D48))) {
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
                                            withStyle(SpanStyle(background = hlColor, color = Color.White)) {
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

                                Text(
                                    text = annotated,
                                    fontSize = fontSize.sp,
                                    lineHeight = (fontSize * 1.7).sp,
                                    fontFamily = FontFamily.Serif,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 6.dp)
                                        .pointerInput(highlightMode, selectedColor) {
                                            if (highlightMode) {
                                                detectDragGestures(
                                                    onDragStart = { offset ->
                                                        view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                                                        val approx = (offset.x / 40).toInt().coerceIn(0, words.size - 1)
                                                        val key = "$blockIndex-$approx"
                                                        if (highlights.containsKey(key)) {
                                                            highlights.remove(key)
                                                        } else {
                                                            highlights[key] = selectedColor
                                                        }
                                                    },
                                                    onDrag = { change, _ ->
                                                        change.consume()
                                                        val approx = (change.position.x / 40).toInt().coerceIn(0, words.size - 1)
                                                        val key = "$blockIndex-$approx"
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

                        // BARRA DE AÇÕES INFERIOR FLUTUANTE
                        Column(
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .fillMaxWidth()
                                .background(Color(0xFF141416))
                        ) {
                            AnimatedVisibility(visible = highlightMode, enter = fadeIn(), exit = fadeOut()) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 24.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    paletteColors.forEach { (hex, _) ->
                                        val c = Color(android.graphics.Color.parseColor(hex))
                                        val isSel = selectedColor == hex
                                        Box(
                                            modifier = Modifier
                                                .padding(horizontal = 8.dp)
                                                .size(if (isSel) 28.dp else 20.dp)
                                                .clip(CircleShape)
                                                .background(c)
                                                .border(if (isSel) 2.dp else 0.dp, Color.White, CircleShape)
                                                .clickable {
                                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                                    selectedColor = hex
                                                }
                                        )
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(72.dp)
                                    .padding(horizontal = 24.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
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
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text("Apagar", fontSize = 11.sp, color = Color(0xFFF87171))
                                }

                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .offset(y = (-12).dp)
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

                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable {
                                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                            highlightMode = !highlightMode
                                        }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Edit,
                                        contentDescription = "Grifar",
                                        tint = if (highlightMode) Color(0xFFFACC15) else Color(0xFF9CA3AF),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text(
                                        text = if (highlightMode) "Ativo" else "Grifar",
                                        fontSize = 11.sp,
                                        color = if (highlightMode) Color(0xFFFACC15) else Color(0xFF9CA3AF)
                                    )
                                }
                            }
                        }
                    }
                }

                // ABA 1: JURISPRUDÊNCIA NATIVA
                1 -> {
                    val precedentes = remember {
                        listOf(
                            NativeJurisprudencia(
                                tribunal = "STF",
                                tipo = "Súmula Vinculante",
                                numero = "56",
                                tese = "A falta de estabelecimento penal adequado não autoriza a manutenção do condenado em regime prisional mais gravoso.",
                                ano = "2023"
                            ),
                            NativeJurisprudencia(
                                tribunal = "STJ",
                                tipo = "Tema Repetitivo",
                                numero = "1092",
                                tese = "É admissível o controle jurisdicional das decisões administrativas em estrita conformidade com a legalidade estrita e devido processo legal.",
                                ano = "2024"
                            ),
                            NativeJurisprudencia(
                                tribunal = "STF",
                                tipo = "Tema RG",
                                numero = "990",
                                tese = "É constitucional o compartilhamento dos relatórios de inteligência financeira do UIF e da Receita Federal com órgãos de persecução penal.",
                                ano = "2022"
                            )
                        )
                    }

                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 18.dp),
                        contentPadding = PaddingValues(top = 12.dp, bottom = 24.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        item {
                            Text(
                                text = "PRECEDENTES & SÚMULAS VINCULADAS",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFFE11D48),
                                letterSpacing = 1.5.sp
                            )
                            Text(
                                text = "Jurisprudência selecionada dos tribunais superiores para o Art. $numero",
                                fontSize = 13.sp,
                                color = Color(0xFF9CA3AF),
                                modifier = Modifier.padding(top = 2.dp, bottom = 6.dp)
                            )
                        }

                        items(precedentes) { item ->
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF18181B))
                                    .border(1.dp, Color(0xFF27272A), RoundedCornerShape(12.dp))
                                    .padding(14.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(if (item.tribunal == "STF") Color(0xFF2563EB) else Color(0xFF059669))
                                                .padding(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Text(item.tribunal, fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color.White)
                                        }
                                        Text("${item.tipo} ${item.numero}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFD1D5DB))
                                    }
                                    Text(item.ano, fontSize = 11.sp, color = Color(0xFF6B7280))
                                }

                                Text(
                                    text = item.tese,
                                    fontSize = 14.sp,
                                    color = Color(0xFFE5E7EB),
                                    lineHeight = 20.sp,
                                    modifier = Modifier.padding(vertical = 10.dp)
                                )

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                                    Text(
                                        text = "Copiar Citação",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF60A5FA),
                                        modifier = Modifier
                                            .clickable {
                                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                                val clip = ClipData.newPlainText("Jurisprudencia", "${item.tribunal} - ${item.tipo} ${item.numero}: ${item.tese}")
                                                clipboard.setPrimaryClip(clip)
                                                Toast.makeText(context, "Citação copiada!", Toast.LENGTH_SHORT).show()
                                            }
                                            .padding(4.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // ABA 2: ANOTAÇÕES & GRAVADOR DE VOZ
                2 -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 18.dp),
                        contentPadding = PaddingValues(top = 12.dp, bottom = 24.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            Text(
                                text = "ANOTAÇÃO EM TEXTO",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFFE11D48),
                                letterSpacing = 1.5.sp
                            )
                            OutlinedTextField(
                                value = textNote,
                                onValueChange = {
                                    textNote = it
                                    prefs.edit().putString("note_$id", it).apply()
                                },
                                placeholder = { Text("Digite suas considerações e anotações sobre este artigo...", color = Color(0xFF6B7280), fontSize = 14.sp) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(130.dp)
                                    .padding(top = 6.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFFE11D48),
                                    unfocusedBorderColor = Color(0xFF27272A),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White,
                                    focusedContainerColor = Color(0xFF18181B),
                                    unfocusedContainerColor = Color(0xFF18181B)
                                ),
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        item {
                            Divider(color = Color(0xFF27272A))
                            Text(
                                text = "GRAVAÇÕES DE VOZ NATIVAS",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFFE11D48),
                                letterSpacing = 1.5.sp,
                                modifier = Modifier.padding(top = 10.dp)
                            )

                            // CARD DO GRAVADOR
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Color(0xFF18181B))
                                    .border(1.dp, if (isRecording) Color(0xFFEF4444) else Color(0xFF27272A), RoundedCornerShape(14.dp))
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .size(52.dp)
                                        .clip(CircleShape)
                                        .background(if (isRecording) Color(0xFFDC2626) else Color(0xFFE11D48))
                                        .clickable {
                                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                            if (isRecording) {
                                                try {
                                                    mediaRecorder?.stop()
                                                    mediaRecorder?.release()
                                                    mediaRecorder = null
                                                    isRecording = false
                                                    loadVoiceNotes()
                                                    Toast.makeText(context, "Gravação salva com sucesso!", Toast.LENGTH_SHORT).show()
                                                } catch (e: Exception) {
                                                    e.printStackTrace()
                                                }
                                            } else {
                                                try {
                                                    val dir = context.getExternalFilesDir(null) ?: context.filesDir
                                                    val noteFile = File(dir, "voice_note_${id}_${System.currentTimeMillis()}.m4a")
                                                    currentRecordingFile = noteFile

                                                    val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                                        MediaRecorder(context)
                                                    } else {
                                                        @Suppress("DEPRECATION")
                                                        MediaRecorder()
                                                    }

                                                    recorder.apply {
                                                        setAudioSource(MediaRecorder.AudioSource.MIC)
                                                        setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                                                        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                                                        setOutputFile(noteFile.absolutePath)
                                                        prepare()
                                                        start()
                                                    }
                                                    mediaRecorder = recorder
                                                    isRecording = true
                                                } catch (e: Exception) {
                                                    e.printStackTrace()
                                                    Toast.makeText(context, "Erro ao acessar microfone", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        }
                                ) {
                                    Icon(
                                        imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.Mic,
                                        contentDescription = "Gravar",
                                        tint = Color.White,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }

                                Column {
                                    Text(
                                        text = if (isRecording) "Gravando áudio..." else "Gravar nota de voz",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = if (isRecording) "Toque no botão para concluir" else "Toque para gravar suas anotações",
                                        fontSize = 12.sp,
                                        color = if (isRecording) Color(0xFFEF4444) else Color(0xFF9CA3AF)
                                    )
                                }
                            }
                        }

                        // LISTA DE GRAVAÇÕES SALVAS
                        if (voiceNotes.isEmpty()) {
                            item {
                                Text(
                                    text = "Nenhum áudio gravado ainda para este artigo.",
                                    fontSize = 13.sp,
                                    color = Color(0xFF6B7280)
                                )
                            }
                        } else {
                            items(voiceNotes) { note ->
                                val isPlayingThis = activePlayingNoteId == note.id
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(Color(0xFF18181B))
                                        .border(1.dp, Color(0xFF27272A), RoundedCornerShape(10.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                        IconButton(
                                            onClick = {
                                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                                if (isPlayingThis) {
                                                    voicePlayer?.stop()
                                                    voicePlayer?.release()
                                                    voicePlayer = null
                                                    activePlayingNoteId = null
                                                } else {
                                                    voicePlayer?.release()
                                                    val player = MediaPlayer().apply {
                                                        setDataSource(note.file.absolutePath)
                                                        prepare()
                                                        start()
                                                        setOnCompletionListener {
                                                            activePlayingNoteId = null
                                                        }
                                                    }
                                                    voicePlayer = player
                                                    activePlayingNoteId = note.id
                                                }
                                            }
                                        ) {
                                            Icon(
                                                imageVector = if (isPlayingThis) Icons.Default.PauseCircle else Icons.Default.PlayCircle,
                                                contentDescription = "Tocar",
                                                tint = Color(0xFF38BDF8),
                                                modifier = Modifier.size(32.dp)
                                            )
                                        }

                                        Column {
                                            Text("Anotação de Voz", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                                            Text(note.dateString, fontSize = 11.sp, color = Color(0xFF9CA3AF))
                                        }
                                    }

                                    IconButton(
                                        onClick = {
                                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                            if (isPlayingThis) {
                                                voicePlayer?.stop()
                                                voicePlayer?.release()
                                                voicePlayer = null
                                                activePlayingNoteId = null
                                            }
                                            note.file.delete()
                                            loadVoiceNotes()
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Delete,
                                            contentDescription = "Excluir",
                                            tint = Color(0xFFF87171),
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
