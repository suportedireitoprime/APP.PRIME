package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

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

data class Noticia(
    val id: String,
    val titulo: String,
    val resumo: String,
    val fonte: String,
    val dataPublicacao: String,
    val conteudo: String
)

class NewsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val accessToken = intent.getStringExtra("accessToken") ?: ""
        
        setContent {
            NewsNativeScreen(
                accessToken = accessToken,
                onClose = { finish() }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsNativeScreen(accessToken: String, onClose: () -> Unit) {
    var noticias by remember { mutableStateOf<List<Noticia>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var selectedNoticia by remember { mutableStateOf<Noticia?>(null) }
    
    val coroutineScope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) {
        coroutineScope.launch(Dispatchers.IO) {
            try {
                val url = URL("https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/noticias_juridicas?select=*&order=data_publicacao.desc&limit=50")
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
                    val loadedNoticias = mutableListOf<Noticia>()
                    for (i in 0 until jsonArray.length()) {
                        val obj = jsonArray.getJSONObject(i)
                        loadedNoticias.add(
                            Noticia(
                                id = obj.optString("id", ""),
                                titulo = obj.optString("titulo", "Sem título"),
                                resumo = obj.optString("resumo", ""),
                                fonte = obj.optString("fonte", "Migalhas"),
                                dataPublicacao = obj.optString("data_publicacao", ""),
                                conteudo = obj.optString("conteudo_md", obj.optString("conteudo", ""))
                            )
                        )
                    }
                    withContext(Dispatchers.Main) {
                        noticias = loadedNoticias
                        isLoading = false
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

    if (selectedNoticia != null) {
        NewsDetailScreen(noticia = selectedNoticia!!, onBack = { selectedNoticia = null })
    } else {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Notícias Jurídicas", color = Color.White) },
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
                        items(noticias) { noticia ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedNoticia = noticia },
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = noticia.titulo,
                                        color = Color.White,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = noticia.fonte + " • " + noticia.dataPublicacao.take(10),
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
fun NewsDetailScreen(noticia: Noticia, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Detalhes", color = Color.White) },
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
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp)
        ) {
            item {
                Text(
                    text = noticia.titulo,
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = noticia.conteudo.ifEmpty { noticia.resumo },
                    color = Color.LightGray,
                    fontSize = 16.sp,
                    lineHeight = 24.sp
                )
            }
        }
    }
}
