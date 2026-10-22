package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONArray
import org.json.JSONObject

data class RadarItem(
    val id: String,
    val tipo_ato: String,
    val numero_ato: String,
    val ementa: String,
    val dataPublicacao: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Radar360Screen(accessToken: String, initialItemsJson: String, onClose: () -> Unit) {
    val items = remember(initialItemsJson) {
        val list = mutableListOf<RadarItem>()
        try {
            val jsonArray = JSONArray(initialItemsJson)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                list.add(
                    RadarItem(
                        id = obj.optString("id", ""),
                        tipo_ato = obj.optString("tipo_ato", "Outro"),
                        numero_ato = obj.optString("numero_ato", "Sem número"),
                        ementa = obj.optString("ementa", ""),
                        dataPublicacao = obj.optString("data_publicacao", "")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        list
    }

    var selectedFilter by remember { mutableStateOf("Todos") }
    val filters = listOf("Todos", "Lei", "Lei Complementar", "Decreto", "Medida Provisória")
    
    val filteredItems = items.filter { 
        selectedFilter == "Todos" || it.tipo_ato == selectedFilter
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Radar de Leis", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text("Resenha diária do Planalto", color = Color.Gray, fontSize = 12.sp)
                    }
                },
                navigationIcon = {
                    Button(onClick = onClose, colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)) {
                        Text("< Voltar", color = Color(0xFFE53935))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E1E1E))
            )
        },
        containerColor = Color(0xFF0D0D0D)
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Filtros Horizontais
            LazyRow(
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp, horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filters) { filterName ->
                    val isSelected = selectedFilter == filterName
                    Box(
                        modifier = Modifier
                            .background(
                                color = if (isSelected) Color(0xFFE53935) else Color(0xFF2A2A2A),
                                shape = RoundedCornerShape(20.dp)
                            )
                            .clickable { selectedFilter = filterName }
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = filterName,
                            color = if (isSelected) Color.White else Color.LightGray,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
            
            // Quantidade de atos
            Text(
                text = "${filteredItems.size} atos encontrados",
                color = Color.Gray,
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            // Lista de Itens
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredItems) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            // Badge
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFFE53935).copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(item.tipo_ato, color = Color(0xFFE53935), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Text(
                                text = item.numero_ato,
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            if (item.ementa.isNotBlank()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = item.ementa,
                                    color = Color.LightGray,
                                    fontSize = 13.sp,
                                    maxLines = 3,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
