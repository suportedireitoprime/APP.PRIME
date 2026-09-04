package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONArray
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResumosScreen(
    initialArea: String?,
    initialTema: String?,
    payload: String?,
    isReader: Boolean,
    onBack: () -> Unit
) {
    // Basic native dark mode UI mimicking the Web App
    val darkBg = Color(0xFF0D0D0D)
    val cardBg = Color(0xFF1A1A1A)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = "Resumos Jurídicos", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
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
            if (isReader) {
                // Reader view placeholder
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Área: $initialArea", color = Color.Gray, fontSize = 14.sp)
                    Text("Tema: $initialTema", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Carregando conteúdo nativo do resumo...", color = Color.White)
                }
            } else {
                // List view placeholder
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            text = if (initialArea != null) "Temas de $initialArea" else "Áreas do Direito",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }
                    items(5) { index ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { /* Navigate deeper or open reader */ },
                            colors = CardDefaults.cardColors(containerColor = cardBg),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = if (initialArea != null) "Tema ${index + 1}" else "Área ${index + 1}",
                                        color = Color.White,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Toque para ver os resumos",
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
