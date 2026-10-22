package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import android.view.HapticFeedbackConstants
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.FlashcardModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardsHubScreen(
    totalCards: Int = 3500,
    estudados: Int = 120,
    hoje: Int = 15,
    meta: Int = 100,
    streak: Int = 5,
    onStartSession: (titulo: String, cards: List<FlashcardModel>) -> Unit,
    onBack: () -> Unit
) {
    val view = LocalView.current
    var showFilterSheet by remember { mutableStateOf(false) }
    var selectedArea by remember { mutableStateOf("Todos") }
    var selectedModo by remember { mutableStateOf("todos") }
    var selectedQuantidade by remember { mutableStateOf(20) }

    val areasList = remember {
        listOf(
            "Todos", "Direito Constitucional", "Direito Penal", "Direito Civil",
            "Direito Administrativo", "Direito Processual Civil", "Direito Processual Penal",
            "Direito Tributário", "Direito do Trabalho", "Direito Empresarial"
        )
    }

    val pct = if (totalCards > 0) ((estudados.toFloat() / totalCards.toFloat()) * 100).toInt().coerceIn(0, 100) else 0

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
                    .padding(horizontal = 16.dp, vertical = 12.dp),
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

                Text(
                    text = "FLASHCARDS",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp
                )
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── HERO BANNER COM MÉTRICAS & STREAK ─────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color(0xFF2A0A10),
                                    Color(0xFF1A0A0E),
                                    Color(0xFF141416)
                                )
                            )
                        )
                        .border(1.dp, Color(0xFF3F161E), RoundedCornerShape(24.dp))
                        .padding(20.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "SEU DESEMPENHO",
                                    color = Color(0xFFA1A1AA),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.sp
                                )
                                Text(
                                    text = "$pct% Dominado",
                                    color = Color.White,
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }

                            // Streak Badge
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFFEA580C).copy(alpha = 0.2f))
                                    .border(1.dp, Color(0xFFEA580C).copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text("🔥", fontSize = 14.sp)
                                Text(
                                    text = "$streak dias",
                                    color = Color(0xFFFB923C),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Barra de Progresso
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF27272A))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(pct / 100f)
                                    .fillMaxHeight()
                                    .background(Color(0xFF36AF85))
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Stats Grid (Estudados, Hoje, Meta)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            StatMiniBlock(label = "Estudados", value = "$estudados")
                            StatMiniBlock(label = "Hoje", value = "$hoje")
                            StatMiniBlock(label = "Meta", value = "$meta")
                            StatMiniBlock(label = "Disponíveis", value = "$totalCards")
                        }
                    }
                }
            }

            // ── CARD PRINCIPAL "PRATICAR FLASHCARDS" ──────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color(0xFF141416))
                        .border(1.dp, Color(0xFF27272A), RoundedCornerShape(24.dp))
                        .padding(20.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(20.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(Color(0xFF36AF85))
                            )
                            Text(
                                text = "PRATICAR FLASHCARDS",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Filtre por matéria ou estude baralhos recomendados com repetição espaçada.",
                            color = Color(0xFFA1A1AA),
                            fontSize = 13.sp
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Botão "Filtro Rápido"
                        Button(
                            onClick = {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                showFilterSheet = true
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2C9570)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.FilterList,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Filtro Rápido",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                imageVector = Icons.Default.ChevronRight,
                                contentDescription = null,
                                tint = Color.White
                            )
                        }
                    }
                }
            }

            // ── 4 ATALHOS RÁPIDOS ─────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    ShortcutCard(
                        title = "Histórico",
                        icon = Icons.Default.History,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                        }
                    )
                    ShortcutCard(
                        title = "Decks",
                        icon = Icons.Default.Folder,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                        }
                    )
                    ShortcutCard(
                        title = "Revisão",
                        icon = Icons.Default.Refresh,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            onStartSession(
                                "Revisão Espaçada",
                                generateMockCards("Revisão", 15)
                            )
                        }
                    )
                    ShortcutCard(
                        title = "Progresso",
                        icon = Icons.Default.BarChart,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                        }
                    )
                }
            }

            // ── RECURSOS (TRILHAS & DESAFIOS) ─────────────────────────────
            item {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "RECURSOS",
                        color = Color(0xFFA1A1AA),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 10.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        FeatureBox(
                            title = "Trilhas",
                            desc = "Guiadas passo a passo",
                            icon = Icons.Default.Route,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                onStartSession("Trilha de Flashcards", generateMockCards("Trilha", 10))
                            }
                        )

                        FeatureBox(
                            title = "Desafios",
                            desc = "Em linha do tempo",
                            icon = Icons.Default.EmojiEvents,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                onStartSession("Desafio Jurídico", generateMockCards("Desafio", 10))
                            }
                        )
                    }
                }
            }

            // ── FREQUÊNCIA SRS (ÚLTIMOS 30 DIAS) ──────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFF141416))
                        .border(1.dp, Color(0xFF27272A), RoundedCornerShape(20.dp))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "SUA FREQUÊNCIA (30 DIAS)",
                                color = Color(0xFFA1A1AA),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = "SRS Ativo",
                                color = Color(0xFF36AF85),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Grid simplificado de 10 blocos de frequência
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            for (i in 1..10) {
                                val intensity = if (i % 3 == 0) Color(0xFF36AF85) else if (i % 2 == 0) Color(0xFF36AF85).copy(alpha = 0.5f) else Color(0xFF27272A)
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(intensity)
                                )
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    // ── MODAL BOTTOM SHEET DE FILTRO RÁPIDO ───────────────────────────────
    if (showFilterSheet) {
        ModalBottomSheet(
            onDismissRequest = { showFilterSheet = false },
            containerColor = Color(0xFF18181B),
            scrimColor = Color.Black.copy(alpha = 0.7f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Configurar Estudo",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = "Área Jurídica",
                    color = Color(0xFFA1A1AA),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(areasList) { area ->
                        val isSelected = area == selectedArea
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isSelected) Color(0xFF2C9570) else Color(0xFF27272A))
                                .clickable {
                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                    selectedArea = area
                                }
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = area,
                                color = if (isSelected) Color.White else Color(0xFFA1A1AA),
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }

                Text(
                    text = "Quantidade de Cards",
                    color = Color(0xFFA1A1AA),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf(10, 20, 30, 50).forEach { qty ->
                        val isSel = qty == selectedQuantidade
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSel) Color(0xFF2C9570) else Color(0xFF27272A))
                                .clickable {
                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                    selectedQuantidade = qty
                                }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$qty",
                                color = if (isSel) Color.White else Color(0xFFA1A1AA),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                        showFilterSheet = false
                        onStartSession(
                            if (selectedArea == "Todos") "Estudo Geral" else selectedArea,
                            generateMockCards(selectedArea, selectedQuantidade)
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2C9570)),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("Começar Sessão ($selectedQuantidade cards)", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}

@Composable
private fun StatMiniBlock(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
        Text(text = label, color = Color(0xFFA1A1AA), fontSize = 11.sp)
    }
}

@Composable
private fun ShortcutCard(title: String, icon: ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF141416))
            .border(1.dp, Color(0xFF27272A), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(imageVector = icon, contentDescription = title, tint = Color(0xFFA1A1AA), modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.height(6.dp))
        Text(text = title, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
    }
}

@Composable
private fun FeatureBox(title: String, desc: String, icon: ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFF141416))
            .border(1.dp, Color(0xFF27272A), RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(imageVector = icon, contentDescription = title, tint = Color(0xFF36AF85), modifier = Modifier.size(28.dp))
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = title, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Text(text = desc, color = Color(0xFFA1A1AA), fontSize = 10.sp)
    }
}

fun generateMockCards(area: String, count: Int): List<FlashcardModel> {
    val sample = listOf(
        FlashcardModel(
            id = "c1",
            pergunta = "Qual é o conceito jurídico de Dolo Eventual?",
            resposta = "Ocorre quando o agente não quer diretamente a realização do tipo penal, mas aceita o risco de produzi-lo (art. 18, I, in fine, do CP).",
            area = area,
            tema = "Teoria do Crime",
            exemplo = "Exemplo: Motorista que aposta racha em via movimentada assumindo o risco de matar pedestres.",
            baseLegal = "Art. 18, I, CP",
            dica = "Diferencia-se da culpa consciente porque nesta o agente acredita sinceramente que o evento não ocorrerá."
        ),
        FlashcardModel(
            id = "c2",
            pergunta = "O que caracteriza a Reserva do Possível no Direito Constitucional?",
            resposta = "Trata-se de limite fático e orçamentário à efetivação dos direitos fundamentais sociais prestacionais pelo Estado.",
            area = area,
            tema = "Direitos Sociais",
            exemplo = "Exemplo: Falta de leitos hospitalares justificada por ausência comprovada de recursos e dotação orçamentária.",
            baseLegal = "Jurisprudência STF - ADPF 45",
            dica = "Não pode ser alegada pelo Estado para violar o Mínimo Existencial do cidadão."
        ),
        FlashcardModel(
            id = "c3",
            pergunta = "O que é a Teoria da Causa Madura no CPC/2015?",
            resposta = "Permite ao tribunal julgar desde logo o mérito quando o processo estiver em condições de imediato julgamento, reformando sentença sem resolução de mérito.",
            area = area,
            tema = "Recursos",
            exemplo = "Exemplo: Apelação contra extinção indevida do processo sem resolução de mérito.",
            baseLegal = "Art. 1.013, § 3º, CPC",
            dica = "Evita o retorno desnecessário dos autos à primeira instância, prestigiando a celeridade."
        )
    )

    return (1..count).map { idx ->
        val base = sample[idx % sample.size]
        base.copy(id = "card_${idx}_${System.currentTimeMillis()}")
    }
}
