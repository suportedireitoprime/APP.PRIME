package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import android.graphics.BitmapFactory
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap

// --- Data Models ---
data class NativeSubtema(
    val id: String,
    val subtema: String,
    val ordem: Int,
    var markdown: String? = null,
    var exemplos: String? = null,
    var termos: String? = null
)

data class NativeTema(
    val tema: String,
    val total: Int,
    val subtemas: List<NativeSubtema>
)

data class NativeArea(
    val area: String,
    val total: Int,
    val coverUrl: String,
    val temas: List<NativeTema>
)

data class ResumoContent(
    val id: String,
    val markdown: String,
    val exemplos: String,
    val termos: String
)

// --- Repository for Async Content Fetching & Image Caching ---
object ResumosRepository {
    private val contentCache = ConcurrentHashMap<String, ResumoContent>()
    val imageCache = ConcurrentHashMap<String, androidx.compose.ui.graphics.ImageBitmap>()

    suspend fun fetchResumoContent(id: String): ResumoContent? = withContext(Dispatchers.IO) {
        contentCache[id]?.let { return@withContext it }
        try {
            val url = URL("https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/resumos_juridicos?select=id,markdown,exemplos,termos&id=eq.$id")
            val conn = url.openConnection() as HttpURLConnection
            conn.setRequestProperty("apikey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0")
            conn.setRequestProperty("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0")
            conn.connectTimeout = 8000
            conn.readTimeout = 8000
            val text = conn.inputStream.bufferedReader().use { it.readText() }
            val arr = JSONArray(text)
            if (arr.length() > 0) {
                val obj = arr.getJSONObject(0)
                val content = ResumoContent(
                    id = obj.optString("id", id),
                    markdown = obj.optString("markdown", ""),
                    exemplos = obj.optString("exemplos", ""),
                    termos = obj.optString("termos", "")
                )
                contentCache[id] = content
                return@withContext content
            }
        } catch (_: Exception) {}
        null
    }
}

// --- Network Image Composable ---
@Composable
fun NetworkImage(
    url: String,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop
) {
    var bitmap by remember(url) { mutableStateOf(ResumosRepository.imageCache[url]) }

    LaunchedEffect(url) {
        if (bitmap == null && url.isNotBlank()) {
            withContext(Dispatchers.IO) {
                try {
                    val conn = URL(url).openConnection()
                    conn.connectTimeout = 6000
                    conn.readTimeout = 6000
                    val stream = conn.getInputStream()
                    val decoded = BitmapFactory.decodeStream(stream)
                    stream.close()
                    if (decoded != null) {
                        val ib = decoded.asImageBitmap()
                        ResumosRepository.imageCache[url] = ib
                        bitmap = ib
                    }
                } catch (_: Exception) {}
            }
        }
    }

    if (bitmap != null) {
        Image(
            bitmap = bitmap!!,
            contentDescription = "Capa",
            modifier = modifier,
            contentScale = contentScale
        )
    } else {
        Box(
            modifier = modifier.background(Color(0xFF222222)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Description,
                contentDescription = null,
                tint = Color.Gray.copy(alpha = 0.6f),
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

// --- JSON Parser ---
fun parseCatalogPayload(jsonStr: String): List<NativeArea> {
    val list = mutableListOf<NativeArea>()
    try {
        val arr = JSONArray(jsonStr)
        for (i in 0 until arr.length()) {
            val areaObj = arr.optJSONObject(i) ?: continue
            val areaName = areaObj.optString("area")
            val total = areaObj.optInt("total", 0)
            val coverUrl = areaObj.optString("coverUrl", "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg")
            val temasArr = areaObj.optJSONArray("temas") ?: JSONArray()

            val temasList = mutableListOf<NativeTema>()
            for (j in 0 until temasArr.length()) {
                val temaObj = temasArr.optJSONObject(j) ?: continue
                val temaName = temaObj.optString("tema")
                val temaTotal = temaObj.optInt("total", 0)
                val subtemasArr = temaObj.optJSONArray("subtemas") ?: JSONArray()

                val subtemasList = mutableListOf<NativeSubtema>()
                for (k in 0 until subtemasArr.length()) {
                    val sObj = subtemasArr.optJSONObject(k) ?: continue
                    subtemasList.add(
                        NativeSubtema(
                            id = sObj.optString("id"),
                            subtema = sObj.optString("subtema"),
                            ordem = sObj.optInt("ordem", k + 1),
                            markdown = sObj.optString("markdown").takeIf { it.isNotBlank() },
                            exemplos = sObj.optString("exemplos").takeIf { it.isNotBlank() },
                            termos = sObj.optString("termos").takeIf { it.isNotBlank() }
                        )
                    )
                }

                temasList.add(
                    NativeTema(
                        tema = temaName,
                        total = temaTotal,
                        subtemas = subtemasList
                    )
                )
            }

            list.add(
                NativeArea(
                    area = areaName,
                    total = total,
                    coverUrl = coverUrl,
                    temas = temasList
                )
            )
        }
    } catch (_: Exception) {}
    return list
}

// --- Main Native Screen ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResumosScreen(
    initialArea: String?,
    initialTema: String?,
    payload: String?,
    isReader: Boolean,
    onBack: () -> Unit
) {
    val darkBg = Color(0xFF0D0D0D)
    val cardBg = Color(0xFF161616)
    val accentRed = Color(0xFFEF4444)

    val catalog = remember(payload) {
        parseCatalogPayload(payload ?: "[]")
    }

    var selectedArea by remember {
        mutableStateOf<NativeArea?>(
            catalog.find { it.area.equals(initialArea, ignoreCase = true) }
        )
    }

    var selectedTema by remember {
        mutableStateOf<NativeTema?>(
            selectedArea?.temas?.find { it.tema.equals(initialTema, ignoreCase = true) }
        )
    }

    var selectedSubtema by remember {
        mutableStateOf<NativeSubtema?>(
            if (isReader && selectedTema != null && selectedTema!!.subtemas.isNotEmpty()) {
                selectedTema!!.subtemas.first()
            } else null
        )
    }

    var searchQuery by remember { mutableStateOf("") }
    var readerTab by remember { mutableStateOf("resumo") } // "resumo", "exemplos", "termos"
    var readerContent by remember { mutableStateOf<ResumoContent?>(null) }
    var isLoadingContent by remember { mutableStateOf(false) }

    // Intercept hardware / system back
    BackHandler {
        when {
            selectedSubtema != null -> selectedSubtema = null
            selectedTema != null -> selectedTema = null
            selectedArea != null -> selectedArea = null
            else -> onBack()
        }
    }

    // Load content when entering a subtema reader
    LaunchedEffect(selectedSubtema) {
        if (selectedSubtema != null) {
            val sub = selectedSubtema!!
            if (sub.markdown != null) {
                readerContent = ResumoContent(
                    id = sub.id,
                    markdown = sub.markdown ?: "",
                    exemplos = sub.exemplos ?: "",
                    termos = sub.termos ?: ""
                )
            } else {
                isLoadingContent = true
                val fetched = ResumosRepository.fetchResumoContent(sub.id)
                readerContent = fetched
                if (fetched != null) {
                    sub.markdown = fetched.markdown
                    sub.exemplos = fetched.exemplos
                    sub.termos = fetched.termos
                }
                isLoadingContent = false
            }
        } else {
            readerContent = null
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when {
                            selectedSubtema != null -> selectedSubtema!!.subtema
                            selectedTema != null -> selectedTema!!.tema
                            selectedArea != null -> selectedArea!!.area
                            else -> "Resumos Jurídicos"
                        },
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                },
                navigationIcon = {
                    IconButton(onClick = {
                        when {
                            selectedSubtema != null -> selectedSubtema = null
                            selectedTema != null -> selectedTema = null
                            selectedArea != null -> selectedArea = null
                            else -> onBack()
                        }
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Voltar", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = darkBg)
            )
        },
        containerColor = darkBg
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                // LEVEL 4: RESUMO READER VIEW
                selectedSubtema != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp)
                    ) {
                        // Tabs selector
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                                .background(Color(0xFF1E1E1E), RoundedCornerShape(24.dp))
                                .padding(4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            listOf("resumo" to "Resumo", "exemplos" to "Exemplos", "termos" to "Termos").forEach { (tabId, label) ->
                                val active = readerTab == tabId
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(if (active) accentRed else Color.Transparent)
                                        .clickable { readerTab = tabId }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = label,
                                        color = if (active) Color.White else Color.Gray,
                                        fontSize = 13.sp,
                                        fontWeight = if (active) FontWeight.Bold else FontWeight.Medium
                                    )
                                }
                            }
                        }

                        if (isLoadingContent) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = accentRed)
                            }
                        } else {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .verticalScroll(rememberScrollState())
                                    .padding(bottom = 32.dp)
                            ) {
                                when (readerTab) {
                                    "resumo" -> {
                                        val text = readerContent?.markdown?.takeIf { it.isNotBlank() }
                                            ?: "Conteúdo do resumo ainda não carregado ou sem texto cadastrado."
                                        Text(
                                            text = text,
                                            color = Color(0xFFF1F1F1),
                                            fontSize = 16.sp,
                                            lineHeight = 26.sp,
                                            modifier = Modifier.padding(top = 8.dp)
                                        )
                                    }
                                    "exemplos" -> {
                                        val text = readerContent?.exemplos?.takeIf { it.isNotBlank() }
                                            ?: "Nenhum caso prático ou exemplo registrado para este tema."
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = cardBg),
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                                        ) {
                                            Text(
                                                text = text,
                                                color = Color.LightGray,
                                                fontSize = 15.sp,
                                                lineHeight = 24.sp,
                                                modifier = Modifier.padding(16.dp)
                                            )
                                        }
                                    }
                                    "termos" -> {
                                        val text = readerContent?.termos?.takeIf { it.isNotBlank() }
                                            ?: "Nenhum vocabulário jurídico específico listado para este resumo."
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = cardBg),
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                                        ) {
                                            Text(
                                                text = text,
                                                color = Color.LightGray,
                                                fontSize = 15.sp,
                                                lineHeight = 24.sp,
                                                modifier = Modifier.padding(16.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // LEVEL 3: LISTA DE SUBTEMAS DO TEMA SELECIONADO
                selectedTema != null -> {
                    val filteredSubtemas = remember(selectedTema, searchQuery) {
                        val list = selectedTema!!.subtemas
                        if (searchQuery.isBlank()) list
                        else list.filter { it.subtema.contains(searchQuery, ignoreCase = true) }
                    }

                    Column(modifier = Modifier.fillMaxSize()) {
                        // Search Box
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Buscar resumo...", color = Color.Gray, fontSize = 14.sp) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.Gray) },
                            trailingIcon = {
                                if (searchQuery.isNotBlank()) {
                                    IconButton(onClick = { searchQuery = "" }) {
                                        Icon(Icons.Default.Close, contentDescription = "Limpar", tint = Color.Gray)
                                    }
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = Color(0xFF141414),
                                unfocusedContainerColor = Color(0xFF141414),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = accentRed.copy(alpha = 0.5f),
                                unfocusedBorderColor = Color(0xFF262626)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        )

                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            itemsIndexed(filteredSubtemas) { index, subtema ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { selectedSubtema = subtema },
                                    colors = CardDefaults.cardColors(containerColor = cardBg),
                                    shape = RoundedCornerShape(14.dp),
                                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(Color(0xFF222222)))
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .padding(16.dp)
                                            .fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .background(Color(0xFF242424), CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "${subtema.ordem}",
                                                color = accentRed,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(14.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = subtema.subtema,
                                                color = Color.White,
                                                fontSize = 15.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                lineHeight = 20.sp
                                            )
                                            Text(
                                                text = "Toque para ler o resumo",
                                                color = Color.Gray,
                                                fontSize = 12.sp,
                                                modifier = Modifier.padding(top = 2.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // LEVEL 2: LISTA DE TEMAS DA ÁREA SELECIONADA
                selectedArea != null -> {
                    val filteredTemas = remember(selectedArea, searchQuery) {
                        val list = selectedArea!!.temas
                        if (searchQuery.isBlank()) list
                        else list.filter { it.tema.contains(searchQuery, ignoreCase = true) }
                    }

                    Column(modifier = Modifier.fillMaxSize()) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Buscar matéria...", color = Color.Gray, fontSize = 14.sp) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.Gray) },
                            trailingIcon = {
                                if (searchQuery.isNotBlank()) {
                                    IconButton(onClick = { searchQuery = "" }) {
                                        Icon(Icons.Default.Close, contentDescription = "Limpar", tint = Color.Gray)
                                    }
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = Color(0xFF141414),
                                unfocusedContainerColor = Color(0xFF141414),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = accentRed.copy(alpha = 0.5f),
                                unfocusedBorderColor = Color(0xFF262626)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        )

                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(filteredTemas) { tema ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            searchQuery = ""
                                            selectedTema = tema
                                        },
                                    colors = CardDefaults.cardColors(containerColor = cardBg),
                                    shape = RoundedCornerShape(16.dp),
                                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(Color(0xFF222222)))
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .padding(12.dp)
                                            .fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        // Capa (64x88dp)
                                        NetworkImage(
                                            url = selectedArea!!.coverUrl,
                                            modifier = Modifier
                                                .width(64.dp)
                                                .height(88.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .border(1.dp, Color(0x22FFFFFF), RoundedCornerShape(8.dp))
                                        )
                                        Spacer(modifier = Modifier.width(14.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = tema.tema,
                                                color = Color.White,
                                                fontSize = 16.sp,
                                                fontWeight = FontWeight.Bold,
                                                lineHeight = 22.sp,
                                                maxLines = 2
                                            )
                                            Text(
                                                text = "${tema.total} resumos",
                                                color = Color.Gray,
                                                fontSize = 13.sp,
                                                modifier = Modifier.padding(top = 4.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // LEVEL 1: LISTA PRINCIPAL DE TODAS AS ÁREAS DO DIREITO
                else -> {
                    val filteredAreas = remember(catalog, searchQuery) {
                        if (searchQuery.isBlank()) catalog
                        else catalog.filter { it.area.contains(searchQuery, ignoreCase = true) }
                    }

                    Column(modifier = Modifier.fillMaxSize()) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Pesquisar área do direito...", color = Color.Gray, fontSize = 14.sp) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.Gray) },
                            trailingIcon = {
                                if (searchQuery.isNotBlank()) {
                                    IconButton(onClick = { searchQuery = "" }) {
                                        Icon(Icons.Default.Close, contentDescription = "Limpar", tint = Color.Gray)
                                    }
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = Color(0xFF141414),
                                unfocusedContainerColor = Color(0xFF141414),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = accentRed.copy(alpha = 0.5f),
                                unfocusedBorderColor = Color(0xFF262626)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        )

                        if (filteredAreas.isEmpty()) {
                            Box(
                                modifier = Modifier.fillMaxSize().padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (searchQuery.isNotBlank()) "Nenhuma área encontrada para \"$searchQuery\"" else "Carregando matérias...",
                                    color = Color.Gray,
                                    fontSize = 15.sp
                                )
                            }
                        } else {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(filteredAreas) { area ->
                                    val displayArea = area.area.replace(Regex("(?i)^DIREITO\\s+(DO\\s+|DA\\s+|DE\\s+)?"), "")
                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                searchQuery = ""
                                                selectedArea = area
                                            },
                                        colors = CardDefaults.cardColors(containerColor = cardBg),
                                        shape = RoundedCornerShape(16.dp),
                                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(Color(0xFF222222)))
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .padding(12.dp)
                                                .fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            // Capa (64x88dp)
                                            NetworkImage(
                                                url = area.coverUrl,
                                                modifier = Modifier
                                                    .width(64.dp)
                                                    .height(88.dp)
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .border(1.dp, Color(0x22FFFFFF), RoundedCornerShape(8.dp))
                                            )
                                            Spacer(modifier = Modifier.width(14.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = displayArea,
                                                    color = Color.White,
                                                    fontSize = 16.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    lineHeight = 22.sp,
                                                    maxLines = 2
                                                )
                                                Text(
                                                    text = "${area.total} resumos • ${area.temas.size} matérias",
                                                    color = Color.Gray,
                                                    fontSize = 13.sp,
                                                    modifier = Modifier.padding(top = 4.dp)
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
    }
}
