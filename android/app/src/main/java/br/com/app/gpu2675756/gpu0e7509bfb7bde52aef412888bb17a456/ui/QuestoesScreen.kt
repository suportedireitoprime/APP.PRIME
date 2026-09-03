package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import android.view.HapticFeedbackConstants
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.QuestaoModel
import kotlinx.coroutines.delay

@Composable
fun QuestoesScreen(
    titulo: String,
    initialQuestoes: List<QuestaoModel>,
    startIndex: Int = 0,
    contexto: String = "pratica",
    onQuestaoAnswered: (questaoId: String, alternativa: String, acertou: boolean, tempoSegundos: Int) -> Unit,
    onSessionCompleted: (total: Int, acertos: Int, erros: Int, tempoTotalSegundos: Int) -> Unit,
    onClose: () -> Unit
) {
    val view = LocalView.current

    var currentIndex by remember { mutableStateOf(startIndex.coerceIn(0, (initialQuestoes.size - 1).coerceAtLeast(0))) }
    var selectedAlt by remember { mutableStateOf<String?>(null) }
    var isAnswered by remember { mutableStateOf(false) }
    var acertosCount by remember { mutableStateOf(0) }
    var errosCount by remember { mutableStateOf(0) }
    var totalSeconds by remember { mutableStateOf(0) }
    var questionSeconds by remember { mutableStateOf(0) }
    var isCompleted by remember { mutableStateOf(initialQuestoes.isEmpty() || startIndex >= initialQuestoes.size) }

    // Cronômetro
    LaunchedEffect(isCompleted) {
        while (!isCompleted) {
            delay(1000)
            totalSeconds++
            questionSeconds++
        }
    }

    val currentQuestao = if (initialQuestoes.isNotEmpty() && currentIndex < initialQuestoes.size) {
        initialQuestoes[currentIndex]
    } else null

    fun formatTimer(seconds: Int): String {
        val m = seconds / 60
        val s = seconds % 60
        return String.format("%02d:%02d", m, s)
    }

    fun submitAnswer() {
        if (currentQuestao == null || selectedAlt == null || isAnswered) return
        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)

        val correta = currentQuestao.gabaritoOficial.trim().uppercase()
        val acertou = selectedAlt!!.trim().uppercase() == correta

        if (acertou) {
            acertosCount++
        } else {
            errosCount++
        }

        isAnswered = true
        onQuestaoAnswered(currentQuestao.id, selectedAlt!!, acertou, questionSeconds)
    }

    fun nextQuestion() {
        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        selectedAlt = null
        isAnswered = false
        questionSeconds = 0

        if (currentIndex + 1 < initialQuestoes.size) {
            currentIndex++
        } else {
            isCompleted = true
            onSessionCompleted(initialQuestoes.size, acertosCount, errosCount, totalSeconds)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF8B0F1A),
                        Color(0xFF4A050B),
                        Color(0xFF14080A),
                        Color(0xFF0D0D0D)
                    )
                )
            )
            .windowInsetsPadding(WindowInsets.statusBars)
    ) {
        if (isCompleted) {
            // ── TELA DE SESSÃO CONCLUÍDA ─────────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(text = "🎯", fontSize = 72.sp)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Treino Finalizado!",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Tempo total: ${formatTimer(totalSeconds)}",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Placar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, Color(0xFF34D399).copy(alpha = 0.3f), RoundedCornerShape(20.dp)),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B).copy(alpha = 0.4f)),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(text = "Acertos", color = Color(0xFF6EE7B7), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "$acertosCount", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
                        }
                    }

                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, Color(0xFFF87171).copy(alpha = 0.3f), RoundedCornerShape(20.dp)),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D).copy(alpha = 0.4f)),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(text = "Erros", color = Color(0xFFFCA5A5), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "$errosCount", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(40.dp))

                Button(
                    onClick = onClose,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB71C1C)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text(text = "CONCLUIR", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                }
            }
        } else if (currentQuestao != null) {
            // ── FLUXO DE RESOLUÇÃO DE QUESTÃO ────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
                    .windowInsetsPadding(WindowInsets.navigationBars)
            ) {
                // Top Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp, bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = onClose,
                        modifier = Modifier
                            .size(48.dp)
                            .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                            .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Voltar",
                            tint = Color.White
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = (currentQuestao.disciplina.ifEmpty { titulo }).uppercase(),
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Questão ${currentIndex + 1} de ${initialQuestoes.size}",
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 11.sp
                        )
                    }

                    // Timer badge
                    Box(
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "⏱ ${formatTimer(questionSeconds)}",
                            color = Color(0xFFFDE68A),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Barra de Progresso
                val progress = (currentIndex + 1).toFloat() / initialQuestoes.size.toFloat().coerceAtLeast(1f)
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(5.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = Color(0xFFEF4444),
                    trackColor = Color.White.copy(alpha = 0.1f)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Conteúdo rolável com Enunciado, Alternativas e Comentário
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                ) {
                    // Badge da Banca / Ano
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (currentQuestao.banca.isNotEmpty()) {
                            Text(
                                text = "${currentQuestao.banca} • ${currentQuestao.ano}",
                                color = Color(0xFFF59E0B),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .background(Color(0xFFF59E0B).copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }

                        if (currentQuestao.assunto.isNotEmpty()) {
                            Text(
                                text = currentQuestao.assunto,
                                color = Color.White.copy(alpha = 0.6f),
                                fontSize = 11.sp,
                                maxLines = 1
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Card do Enunciado
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF141416).copy(alpha = 0.9f)),
                        shape = RoundedCornerShape(20.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                    ) {
                        Text(
                            text = currentQuestao.enunciado,
                            color = Color.White,
                            fontSize = 15.sp,
                            lineHeight = 22.sp,
                            modifier = Modifier.padding(18.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Lista de Alternativas (A, B, C, D, E)
                    val alternativas = listOfNotNull(
                        if (currentQuestao.altA.isNotEmpty()) "A" to currentQuestao.altA else null,
                        if (currentQuestao.altB.isNotEmpty()) "B" to currentQuestao.altB else null,
                        if (currentQuestao.altC.isNotEmpty()) "C" to currentQuestao.altC else null,
                        if (currentQuestao.altD.isNotEmpty()) "D" to currentQuestao.altD else null,
                        if (currentQuestao.altE.isNotEmpty()) "E" to currentQuestao.altE else null
                    )

                    alternativas.forEach { (letra, texto) ->
                        val isSelected = selectedAlt == letra
                        val isCorrect = currentQuestao.gabaritoOficial.trim().uppercase() == letra

                        val containerColor = when {
                            isAnswered && isCorrect -> Color(0xFF064E3B).copy(alpha = 0.7f)
                            isAnswered && isSelected && !isCorrect -> Color(0xFF7F1D1D).copy(alpha = 0.7f)
                            isSelected -> Color(0xFF1E3A8A).copy(alpha = 0.6f)
                            else -> Color(0xFF1A1A1E).copy(alpha = 0.8f)
                        }

                        val borderColor = when {
                            isAnswered && isCorrect -> Color(0xFF34D399)
                            isAnswered && isSelected && !isCorrect -> Color(0xFFF87171)
                            isSelected -> Color(0xFF60A5FA)
                            else -> Color.White.copy(alpha = 0.12f)
                        }

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 5.dp)
                                .clickable(enabled = !isAnswered) {
                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                    selectedAlt = letra
                                },
                            colors = CardDefaults.cardColors(containerColor = containerColor),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, borderColor)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(borderColor.copy(alpha = 0.2f), CircleShape)
                                        .border(1.dp, borderColor, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (isAnswered && isCorrect) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF34D399), modifier = Modifier.size(18.dp))
                                    } else if (isAnswered && isSelected && !isCorrect) {
                                        Icon(Icons.Default.Close, contentDescription = null, tint = Color(0xFFF87171), modifier = Modifier.size(18.dp))
                                    } else {
                                        Text(text = letra, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Text(
                                    text = texto,
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    lineHeight = 20.sp,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // Gabarito Comentado (expande ao responder)
                    AnimatedVisibility(
                        visible = isAnswered,
                        enter = fadeIn() + slideInVertically()
                    ) {
                        Column(modifier = Modifier.padding(top = 16.dp)) {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E24)),
                                shape = RoundedCornerShape(20.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF34D399).copy(alpha = 0.3f))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "GABARITO: LETRA ${currentQuestao.gabaritoOficial}",
                                            color = Color(0xFF34D399),
                                            fontWeight = FontWeight.Black,
                                            fontSize = 13.sp
                                        )

                                        Text(
                                            text = if (selectedAlt == currentQuestao.gabaritoOficial) "Você Acertou! 👏" else "Você Errou",
                                            color = if (selectedAlt == currentQuestao.gabaritoOficial) Color(0xFF34D399) else Color(0xFFF87171),
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }

                                    if (currentQuestao.gabaritoComentado.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(10.dp))
                                        Text(
                                            text = currentQuestao.gabaritoComentado,
                                            color = Color.White.copy(alpha = 0.9f),
                                            fontSize = 13.sp,
                                            lineHeight = 20.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Dock Inferior com Botão Primário
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 14.dp)
                ) {
                    if (!isAnswered) {
                        Button(
                            onClick = { submitAnswer() },
                            enabled = selectedAlt != null,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF059669),
                                disabledContainerColor = Color.White.copy(alpha = 0.1f)
                            ),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp)
                        ) {
                            Text(
                                text = "RESPONDER",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = if (selectedAlt != null) Color.White else Color.White.copy(alpha = 0.4f)
                            )
                        }
                    } else {
                        Button(
                            onClick = { nextQuestion() },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB71C1C)),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp)
                        ) {
                            Text(
                                text = if (currentIndex + 1 < initialQuestoes.size) "PRÓXIMA QUESTÃO" else "VER RESULTADO",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}
