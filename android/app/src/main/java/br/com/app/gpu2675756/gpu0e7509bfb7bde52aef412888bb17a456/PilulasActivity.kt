package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.io.BufferedReader
import java.io.InputStreamReader

data class Pilula(
    val id: String,
    val titulo: String,
    val autor: String,
    val capaUrl: String,
    val audioUrl: String,
    val resumo: String
)

class PilulasActivity : ComponentActivity() {
    private var mediaPlayer: MediaPlayer? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val accessToken = intent.getStringExtra("accessToken") ?: ""
        val startPilulaId = intent.getStringExtra("startPilulaId") ?: ""
        
        setContent {
            PilulasNativeScreen(
                accessToken = accessToken,
                startPilulaId = startPilulaId,
                onClose = { finish() },
                playAudio = { url -> playAudio(url) },
                stopAudio = { stopAudio() }
            )
        }
    }
    
    private fun playAudio(url: String) {
        if (url.isEmpty()) return
        stopAudio()
        try {
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setDataSource(url)
                prepareAsync()
                setOnPreparedListener { start() }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    private fun stopAudio() {
        mediaPlayer?.let {
            if (it.isPlaying) {
                it.stop()
            }
            it.release()
        }
        mediaPlayer = null
    }

    override fun onDestroy() {
        super.onDestroy()
        stopAudio()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PilulasNativeScreen(
    accessToken: String, 
    startPilulaId: String, 
    onClose: () -> Unit,
    playAudio: (String) -> Unit,
    stopAudio: () -> Unit
) {
    var pilulas by remember { mutableStateOf<List<Pilula>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var selectedPilula by remember { mutableStateOf<Pilula?>(null) }
    var isPlaying by remember { mutableStateOf(false) }
    
    val coroutineScope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) {
        coroutineScope.launch(Dispatchers.IO) {
            try {
                // TODO: Expand API URL if multiple tables needed (e.g. lei seca, classicos). Assuming classicos for now.
                val url = URL("https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/livros_classicos?select=*")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("apikey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0")
                if (accessToken.isNotEmpty()) {
                    connection.setRequestProperty("Authorization", "Bearer $accessToken")
                }
                
                val responseCode = connection.responseCode
                if (responseCode == 200) {
                    val reader = BufferedReader(InputStreamReader(connection.inputStream))
                    val response = reader.readText()
                    reader.close()
                    
                    val jsonArray = JSONArray(response)
                    val loaded = mutableListOf<Pilula>()
                    for (i in 0 until jsonArray.length()) {
                        val obj = jsonArray.getJSONObject(i)
                        loaded.add(
                            Pilula(
                                id = obj.optString("id", ""),
                                titulo = obj.optString("titulo", "Sem título"),
                                autor = obj.optString("autor", ""),
                                capaUrl = obj.optString("capa", ""),
                                audioUrl = obj.optString("audio_resumo_url", ""),
                                resumo = obj.optString("resumo", "")
                            )
                        )
                    }
                    withContext(Dispatchers.Main) {
                        pilulas = loaded
                        isLoading = false
                        if (startPilulaId.isNotEmpty()) {
                            val startP = loaded.find { it.id == startPilulaId }
                            if (startP != null) {
                                selectedPilula = startP
                            }
                        }
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        errorMessage = "Erro HTTP: $responseCode"
                        isLoading = false
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    errorMessage = "Erro de Rede: ${e.message}"
                    isLoading = false
                }
            }
        }
    }

    if (selectedPilula != null) {
        PilulaPlayerScreen(
            pilula = selectedPilula!!,
            isPlaying = isPlaying,
            onPlayPause = { 
                if (isPlaying) {
                    stopAudio()
                    isPlaying = false
                } else {
                    playAudio(selectedPilula!!.audioUrl)
                    isPlaying = true
                }
            },
            onBack = {
                stopAudio()
                isPlaying = false
                selectedPilula = null 
            }
        )
    } else {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Pílulas de Áudio", color = Color.White) },
                    navigationIcon = {
                        Button(onClick = onClose, colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)) {
                            Text("< Voltar", color = Color(0xFF10b981))
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E1E1E))
                )
            },
            containerColor = Color(0xFF0D0D0D)
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = Color(0xFF10b981))
                } else if (errorMessage != null) {
                    Text(text = errorMessage!!, color = Color.Red, modifier = Modifier.align(Alignment.Center))
                } else {
                    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(pilulas) { pilula ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedPilula = pilula },
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = pilula.titulo,
                                        color = Color.White,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = pilula.autor.ifEmpty { "Desconhecido" },
                                        color = Color.Gray,
                                        fontSize = 12.sp
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PilulaPlayerScreen(pilula: Pilula, isPlaying: Boolean, onPlayPause: () -> Unit, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tocador Nativo", color = Color.White) },
                navigationIcon = {
                    Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)) {
                        Text("< Voltar", color = Color(0xFF10b981))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E1E1E))
            )
        },
        containerColor = Color(0xFF0D0D0D)
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(200.dp)
                    .background(Color.DarkGray, RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text("Capa", color = Color.White) // Placeholder for AsyncImage
            }
            Spacer(modifier = Modifier.height(32.dp))
            Text(
                text = pilula.titulo,
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = pilula.autor,
                color = Color.Gray,
                fontSize = 16.sp
            )
            Spacer(modifier = Modifier.height(48.dp))
            
            if (pilula.audioUrl.isNotEmpty()) {
                Button(
                    onClick = onPlayPause,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10b981)),
                    modifier = Modifier.fillMaxWidth().height(56.dp)
                ) {
                    Text(if (isPlaying) "Pausar" else "Ouvir Pílula", fontSize = 18.sp, color = Color.White)
                }
            } else {
                Text("Áudio indisponível", color = Color.Red)
            }
        }
    }
}
