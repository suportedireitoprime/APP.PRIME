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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class NativeAreaVideoItem(
    val id: String,
    val nome: String,
    val totalAulas: Int,
    val icone: String = "gavel",
    val corDestaque: Color = Color(0xFFF59E0B)
)

@Composable
fun VideoaulasHubScreen(
    onPlayAula: (NativeVideoaulaModel, List<NativeVideoaulaModel>) -> Unit,
    onBack: () -> Unit
) {
    val view = LocalView.current
    var selectedCatalogo by remember { mutableStateOf("Áreas do Direito") }
    var searchQuery by remember { mutableStateOf("") }

    val catalogos = remember {
        listOf("Áreas do Direito", "OAB 1ª Fase", "OAB 2ª Fase", "Para Iniciantes")
    }

    val areasList = remember {
        listOf(
            NativeAreaVideoItem("penal", "Direito Penal", 48, corDestaque = Color(0xFFEF4444)),
            NativeAreaVideoItem("const", "Direito Constitucional", 56, corDestaque = Color(0xFFF59E0B)),
            NativeAreaVideoItem("civil", "Direito Civil", 62, corDestaque = Color(0xFF3B82F6)),
            NativeAreaVideoItem("adm", "Direito Administrativo", 42, corDestaque = Color(0xFF10B981)),
            NativeAreaVideoItem("proc_penal", "Processo Penal", 38, corDestaque = Color(0xFF8B5CF6)),
            NativeAreaVideoItem("proc_civil", "Processo Civil", 45, corDestaque = Color(0xFF06B6D4)),
            NativeAreaVideoItem("trib", "Direito Tributário", 28, corDestaque = Color(0xFFEC4899)),
            NativeAreaVideoItem("trab", "Direito do Trabalho", 35, corDestaque = Color(0xFFF97316))
        )
    }

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
                    text = "VIDEOAULAS",
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
            // ── HERO CARD COM MÉTRICAS & HORAS ────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color(0xFF2E1A05),
                                    Color(0xFF1C1003),
                                    Color(0xFF141416)
                                )
                            )
                        )
                        .border(1.dp, Color(0xFF54340C), RoundedCornerShape(24.dp))
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
                                    text = "SUA JORNADA EM VÍDEO",
                                    color = Color(0xFFA1A1AA),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.sp
                                )
                                Text(
                                    text = "42 Horas Assistidas",
                                    color = Color.White,
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }

                            // Badge de Conquista
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFFF59E0B).copy(alpha = 0.2f))
                                    .border(1.dp, Color(0xFFF59E0B).copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text("🎬", fontSize = 14.sp)
                                Text(
                                    text = "Nível Ouro",
                                    color = Color(0xFFFBBF24),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Progresso Linear
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF27272A))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(0.55f)
                                    .fillMaxHeight()
                                    .background(Color(0xFFF59E0B))
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Mini Estatísticas
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            HubStatItem("Aulas Vistas", "84")
                            HubStatItem("Em Andamento", "6")
                            HubStatItem("Disciplinas", "8")
                            HubStatItem("Disponíveis", "350+")
                        }
                    }
                }
            }

            // ── BUSCA RÁPIDA DE VIDEOAULAS ────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFF141416))
                        .border(1.dp, Color(0xFF27272A), RoundedCornerShape(20.dp))
                        .padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = null,
                            tint = Color(0xFFA1A1AA),
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            text = "Pesquisar por disciplina, tema ou assunto...",
                            color = Color(0xFF71717A),
                            fontSize = 14.sp,
                            modifier = Modifier.weight(1f)
                        )
                        Icon(
                            imageVector = Icons.Default.Mic,
                            contentDescription = null,
                            tint = Color(0xFFA1A1AA),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // ── 4 ATALHOS RÁPIDOS ─────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    HubShortcutCard("Favoritos", Icons.Default.Bookmark, Modifier.weight(1f)) {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                    }
                    HubShortcutCard("Recentes", Icons.Default.History, Modifier.weight(1f)) {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                    }
                    HubShortcutCard("Anotações", Icons.Default.EditNote, Modifier.weight(1f)) {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                    }
                    HubShortcutCard("Trilhas", Icons.Default.Route, Modifier.weight(1f)) {
                        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                    }
                }
            }

            // ── SELETOR DE CATÁLOGOS ──────────────────────────────────────
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(catalogos) { cat ->
                        val isSel = cat == selectedCatalogo
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isSel) Color(0xFFF59E0B) else Color(0xFF18181B))
                                .border(1.dp, if (isSel) Color(0xFFF59E0B) else Color(0xFF27272A), RoundedCornerShape(20.dp))
                                .clickable {
                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                    selectedCatalogo = cat
                                }
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = cat,
                                color = if (isSel) Color.Black else Color(0xFFA1A1AA),
                                fontSize = 13.sp,
                                fontWeight = if (isSel) FontWeight.Black else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // ── GRID DE DISCIPLINAS E AULAS ───────────────────────────────
            item {
                Text(
                    text = "DISCIPLINAS EM DESTAQUE",
                    color = Color(0xFFA1A1AA),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(top = 4.dp, bottom = 2.dp)
                )
            }

            items(areasList) { areaItem ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color(0xFF141416))
                        .border(1.dp, Color(0xFF27272A), RoundedCornerShape(18.dp))
                        .clickable {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            val mockAula = NativeVideoaulaModel(
                                id = "aula_${areaItem.id}_1",
                                videoId = "dQw4w9WgXcQ", // ID demonstrativo
                                titulo = "Aula 1: Introdução aos Princípios de ${areaItem.nome}",
                                area = areaItem.nome,
                                duracaoSegundos = 1800,
                                descricao = "Visão geral completa dos conceitos fundamentais, postulados e estrutura da disciplina com foco em concursos e OAB."
                            )
                            val mockPlaylist = listOf(
                                mockAula,
                                NativeVideoaulaModel("aula_${areaItem.id}_2", "dQw4w9WgXcQ", "Aula 2: Teoria Geral e Aplicação Prática", areaItem.nome, 1600),
                                NativeVideoaulaModel("aula_${areaItem.id}_3", "dQw4w9WgXcQ", "Aula 3: Jurisprudência dos Tribunais Superiores", areaItem.nome, 2100)
                            )
                            onPlayAula(mockAula, mockPlaylist)
                        }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(areaItem.corDestaque.copy(alpha = 0.15f))
                            .border(1.dp, areaItem.corDestaque.copy(alpha = 0.35f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayCircleOutline,
                            contentDescription = null,
                            tint = areaItem.corDestaque,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = areaItem.nome,
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "${areaItem.totalAulas} aulas disponíveis",
                            color = Color(0xFFA1A1AA),
                            fontSize = 12.sp
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = Color(0xFF71717A),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun HubStatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
        Text(text = label, color = Color(0xFFA1A1AA), fontSize = 11.sp)
    }
}

@Composable
private fun HubShortcutCard(title: String, icon: ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF141416))
            .border(1.dp, Color(0xFF27272A), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(imageVector = icon, contentDescription = title, tint = Color(0xFFA1A1AA), modifier = Modifier.size(22.dp))
        Spacer(modifier = Modifier.height(6.dp))
        Text(text = title, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
    }
}
