package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import android.view.HapticFeedbackConstants
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

data class NativeLivro(
    val id: String,
    val titulo: String,
    val autor: String = "",
    val capa: String = "",
    val sobre: String = "",
    val colecao: String = "",
    val area: String = "",
    val paginas: Int = 0,
    val downloadUrl: String = ""
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BibliotecaScreen(
    initialAba: String = "acervos",
    initialMateria: String = "",
    initialLivroId: String = "",
    accessToken: String = "",
    onClose: () -> Unit
) {
    val view = LocalView.current
    var selectedAba by remember { mutableStateOf(initialAba) }
    var searchQuery by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var selectedLivro by remember { mutableStateOf<NativeLivro?>(null) }
    var livros by remember { mutableStateOf<List<NativeLivro>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    val coroutineScope = rememberCoroutineScope()

    // Obras base para carregamento instantâneo offline (0ms)
    val fallbackLivros = remember {
        listOf(
            NativeLivro(
                id = "cl-1",
                titulo = "Dos Delitos e das Penas",
                autor = "Cesare Beccaria",
                sobre = "Obra seminal que fundou os pilares modernos do Direito Penal garantista e a proporcionalidade das penas.",
                colecao = "classicos",
                area = "Direito Penal",
                paginas = 160
            ),
            NativeLivro(
                id = "cl-2",
                titulo = "O Espírito das Leis",
                autor = "Montesquieu",
                sobre = "Tratado fundamental sobre a separação dos três poderes do Estado e a teoria republicana.",
                colecao = "classicos",
                area = "Teoria do Estado",
                paginas = 480
            ),
            NativeLivro(
                id = "cl-3",
                titulo = "O Caso dos Exploradores de Cavernas",
                autor = "Lon L. Fuller",
                sobre = "Famoso dilema jurídico que explora jusnaturalismo, positivismo e moralidade no Direito.",
                colecao = "classicos",
                area = "Filosofia do Direito",
                paginas = 112
            ),
            NativeLivro(
                id = "oab-1",
                titulo = "Manual Prático de Ética e Estatuto da OAB",
                autor = "Equipe Prime",
                sobre = "Guia completo com artigos fundamentais e questões comentadas para aprovação no Exame de Ordem.",
                colecao = "oab",
                area = "Ética Profissional",
                paginas = 240
            ),
            NativeLivro(
                id = "perf-1",
                titulo = "Oratória Forense e Argumentação",
                autor = "Direito Prime",
                sobre = "Técnicas de sustentação oral, postura, clareza e persuasão jurídica para tribunais.",
                colecao = "performance",
                area = "Oratória",
                paginas = 190
            ),
            NativeLivro(
                id = "mat-1",
                titulo = "Curso de Direito Constitucional Aplicado",
                autor = "Doutrina Selecionada",
                sobre = "Direitos e garantias fundamentais, controle de constitucionalidade e organização dos poderes.",
                colecao = "materias",
                area = "Constitucional",
                paginas = 520
            ),
            NativeLivro(
                id = "mat-2",
                titulo = "Direito Civil Contemporâneo",
                autor = "Doutrina Selecionada",
                sobre = "Parte geral, contratos civis, responsabilidade civil e direitos reais.",
                colecao = "materias",
                area = "Civil",
                paginas = 610
            )
        )
    }

    LaunchedEffect(Unit) {
        livros = fallbackLivros
        coroutineScope.launch(Dispatchers.IO) {
            try {
                val url = URL("https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/biblioteca_classicos?select=id,livro,autor,sobre,download&limit=40")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("apikey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0")
                if (accessToken.isNotEmpty()) {
                    connection.setRequestProperty("Authorization", "Bearer $accessToken")
                }
                if (connection.responseCode == 200) {
                    val reader = BufferedReader(InputStreamReader(connection.inputStream))
                    val response = reader.readText()
                    reader.close()
                    val jsonArray = JSONArray(response)
                    val apiLivros = mutableListOf<NativeLivro>()
                    for (i in 0 until jsonArray.length()) {
                        val obj = jsonArray.getJSONObject(i)
                        apiLivros.add(
                            NativeLivro(
                                id = obj.optString("id", "cl-$i"),
                                titulo = obj.optString("livro", "Sem título"),
                                autor = obj.optString("autor", "Autor Clássico"),
                                sobre = obj.optString("sobre", ""),
                                colecao = "classicos",
                                area = "Clássicos do Direito",
                                paginas = 250,
                                downloadUrl = obj.optString("download", "")
                            )
                        )
                    }
                    withContext(Dispatchers.Main) {
                        if (apiLivros.isNotEmpty()) {
                            livros = apiLivros + fallbackLivros.filter { it.colecao != "classicos" }
                        }
                        isLoading = false
                    }
                } else {
                    withContext(Dispatchers.Main) { isLoading = false }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { isLoading = false }
            }
        }
    }

    val filteredLivros = remember(livros, selectedAba, searchQuery) {
        livros.filter { livro ->
            val matchAba = when (selectedAba) {
                "acervos" -> true
                "performance" -> livro.colecao == "performance"
                "materias" -> livro.colecao == "materias"
                "classicos" -> livro.colecao == "classicos"
                "oab" -> livro.colecao == "oab"
                else -> true
            }
            val matchSearch = searchQuery.isBlank() ||
                livro.titulo.contains(searchQuery, ignoreCase = true) ||
                livro.autor.contains(searchQuery, ignoreCase = true) ||
                livro.area.contains(searchQuery, ignoreCase = true)

            matchAba && matchSearch
        }
    }

    val abas = listOf(
        "acervos" to "Todos os Acervos",
        "performance" to "Performance",
        "materias" to "Matérias",
        "classicos" to "Clássicos",
        "oab" to "OAB"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0D0D))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // ── TOP BAR NATIVA ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(
                    onClick = {
                        view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
                        onClose()
                    },
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1E1E1E))
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Voltar",
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Text(
                    text = "BIBLIOTECA JURÍDICA",
                    color = Color.White,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )

                IconButton(
                    onClick = {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                        isSearching = !isSearching
                        if (!isSearching) searchQuery = ""
                    },
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(if (isSearching) Color(0xFF8B0F1A) else Color(0xFF1E1E1E))
                ) {
                    Icon(
                        imageVector = if (isSearching) Icons.Default.Close else Icons.Default.Search,
                        contentDescription = "Buscar",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // ── CAMPO DE BUSCA AO VIVO (EXPANSÍVEL) ──
            AnimatedVisibility(
                visible = isSearching,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Pesquisar livro, autor ou tema...", color = Color.Gray, fontSize = 14.sp) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFFF59E0B),
                        unfocusedBorderColor = Color(0xFF2A2A2A),
                        focusedContainerColor = Color(0xFF161616),
                        unfocusedContainerColor = Color(0xFF161616)
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            // ── SELETOR DE ABAS / COLEÇÕES EM PÍLULAS NATIVAS ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                abas.forEach { (id, label) ->
                    val isSelected = selectedAba == id
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(
                                if (isSelected) Color(0xFFF59E0B) else Color(0xFF1C1C1E)
                            )
                            .border(
                                width = 1.dp,
                                color = if (isSelected) Color(0xFFFBBF24) else Color(0xFF2E2E30),
                                shape = RoundedCornerShape(20.dp)
                            )
                            .clickable {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                selectedAba = id
                            }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = label,
                            color = if (isSelected) Color(0xFF1A1300) else Color(0xFFCCCCCC),
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }

            // ── LISTA DE LIVROS (120FPS COM LAZYCOLUMN) ──
            if (filteredLivros.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (searchQuery.isNotEmpty()) "Nenhuma obra encontrada para \"$searchQuery\"" else "Nenhum livro disponível nesta seção.",
                        color = Color.Gray,
                        fontSize = 14.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 96.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredLivros, key = { it.id }) { livro ->
                        NativeLivroCard(
                            livro = livro,
                            onClick = {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                selectedLivro = livro
                            }
                        )
                    }
                }
            }
        }

        // ── MODAL NATIVO DE DETALHES DA OBRA ──
        if (selectedLivro != null) {
            NativeLivroDetailSheet(
                livro = selectedLivro!!,
                onDismiss = { selectedLivro = null }
            )
        }
    }
}

@Composable
fun NativeLivroCard(
    livro: NativeLivro,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, Color(0xFF262628), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF161618))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Mini Capa / Ícone Estilizado
            Box(
                modifier = Modifier
                    .size(width = 54.dp, height = 74.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFF333338), Color(0xFF1E1E22))
                        )
                    )
                    .border(1.dp, Color(0xFF3E3E44), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Book,
                    contentDescription = null,
                    tint = Color(0xFFF59E0B),
                    modifier = Modifier.size(24.dp)
                )
            }

            // Informações
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                if (livro.area.isNotEmpty()) {
                    Text(
                        text = livro.area.uppercase(),
                        color = Color(0xFFF59E0B),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
                Text(
                    text = livro.titulo,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                if (livro.autor.isNotEmpty()) {
                    Text(
                        text = livro.autor,
                        color = Color(0xFFAAAAAA),
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Tag Páginas / Ação
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.Center
            ) {
                if (livro.paginas > 0) {
                    Text(
                        text = "${livro.paginas} págs",
                        color = Color(0xFF777777),
                        fontSize = 11.sp
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF222226))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Ler",
                        color = Color(0xFFFBBF24),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun NativeLivroDetailSheet(
    livro: NativeLivro,
    onDismiss: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.75f))
            .clickable(onClick = onDismiss),
        contentAlignment = Alignment.BottomCenter
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.72f)
                .clickable(enabled = false) {}
                .navigationBarsPadding(),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF141416))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Barra de fechamento
                Box(
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .width(40.dp)
                        .height(4.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF333333))
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        if (livro.area.isNotEmpty()) {
                            Text(
                                text = livro.area.uppercase(),
                                color = Color(0xFFF59E0B),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                        Text(
                            text = livro.titulo,
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        if (livro.autor.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Por ${livro.autor}",
                                color = Color(0xFFCCCCCC),
                                fontSize = 13.sp
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF222224))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Fechar",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Color(0xFF222226))
                Spacer(modifier = Modifier.height(16.dp))

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                ) {
                    Text(
                        text = "SOBRE A OBRA",
                        color = Color(0xFF888888),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = if (livro.sobre.isNotBlank()) livro.sobre else "Obra integrante do acervo permanente da Biblioteca Jurídica Direito Prime.",
                        color = Color(0xFFE0E0E0),
                        fontSize = 14.sp,
                        lineHeight = 22.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onDismiss,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFF59E0B)
                    ),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        text = "FECHAR DETALHES",
                        color = Color(0xFF141416),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }
        }
    }
}
