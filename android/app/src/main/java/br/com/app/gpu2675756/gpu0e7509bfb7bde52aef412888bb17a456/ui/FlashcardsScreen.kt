package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import android.view.HapticFeedbackConstants
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.FlashcardModel
import kotlinx.coroutines.launch
import kotlin.math.abs

@Composable
fun FlashcardsScreen(
    titulo: String,
    initialCards: List<FlashcardModel>,
    startIndex: Int = 0,
    onCardAnswered: (cardId: String, status: String, area: String, tema: String) -> Unit,
    onSessionCompleted: (total: Int, compreendidos: Int, revisar: Int) -> Unit,
    onClose: () -> Unit
) {
    val view = LocalView.current
    val coroutineScope = rememberCoroutineScope()

    var currentIndex by remember { mutableStateOf(startIndex.coerceIn(0, (initialCards.size - 1).coerceAtLeast(0))) }
    var isFlipped by remember { mutableStateOf(false) }
    var compreendidosCount by remember { mutableStateOf(0) }
    var revisarCount by remember { mutableStateOf(0) }
    var isCompleted by remember { mutableStateOf(initialCards.isEmpty() || startIndex >= initialCards.size) }
    var showDica by remember { mutableStateOf(false) }

    val offsetX = remember { Animatable(0f) }
    val density = LocalDensity.current

    val currentCard = if (initialCards.isNotEmpty() && currentIndex < initialCards.size) {
        initialCards[currentIndex]
    } else null

    fun responder(status: String) {
        if (currentCard == null) return
        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)

        if (status == "compreendido") {
            compreendidosCount++
        } else {
            revisarCount++
        }

        onCardAnswered(currentCard.id, status, currentCard.area, currentCard.tema)

        coroutineScope.launch {
            val targetOffset = if (status == "compreendido") 1200f else -1200f
            offsetX.animateTo(targetOffset, tween(250))
            isFlipped = false
            showDica = false
            offsetX.snapTo(0f)

            if (currentIndex + 1 < initialCards.size) {
                currentIndex++
            } else {
                isCompleted = true
                onSessionCompleted(initialCards.size, compreendidosCount, revisarCount)
            }
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
                Text(
                    text = "🏆",
                    fontSize = 72.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Sessão Concluída!",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Você finalizou todos os flashcards deste bloco com sucesso.",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Placar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Compreendidos
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
                            Text(text = "Compreendidos", color = Color(0xFF6EE7B7), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "$compreendidosCount", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
                        }
                    }

                    // A Revisar
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
                            Text(text = "A Revisar", color = Color(0xFFFCA5A5), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "$revisarCount", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
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

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = {
                        currentIndex = 0
                        compreendidosCount = 0
                        revisarCount = 0
                        isCompleted = false
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = ButtonDefaults.outlinedButtonBorder.copy(brush = Brush.horizontalGradient(listOf(Color.White.copy(alpha = 0.3f), Color.White.copy(alpha = 0.3f))))
                ) {
                    Text(text = "REINICIAR BLOCO", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.White)
                }
            }
        } else if (currentCard != null) {
            // ── FLUXO DE REVISÃO ATIVA DOS FLASHCARDS ─────────────────
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
                    .windowInsetsPadding(WindowInsets.navigationBars),
                horizontalAlignment = Alignment.CenterHorizontally
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
                            text = titulo.uppercase(),
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Card ${currentIndex + 1} de ${initialCards.size}",
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 12.sp
                        )
                    }

                    Box(modifier = Modifier.size(48.dp))
                }

                // Barra de Progresso
                val progress = (currentIndex + 1).toFloat() / initialCards.size.toFloat().coerceAtLeast(1f)
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = Color(0xFF34D399),
                    trackColor = Color.White.copy(alpha = 0.1f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Card Interativo 3D com Flip & Gestos de Swipe
                val rotation by animateFloatAsState(
                    targetValue = if (isFlipped) 180f else 0f,
                    animationSpec = tween(durationMillis = 350),
                    label = "CardFlip"
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .offset(x = with(density) { offsetX.value.toDp() })
                        .graphicsLayer {
                            rotationY = rotation
                            cameraDistance = 12f * density
                            rotationZ = (offsetX.value / 60f).coerceIn(-15f, 15f)
                        }
                        .pointerInput(Unit) {
                            detectHorizontalDragGestures(
                                onDragEnd = {
                                    coroutineScope.launch {
                                        if (offsetX.value > 250f) {
                                            responder("compreendido")
                                        } else if (offsetX.value < -250f) {
                                            responder("revisar")
                                        } else {
                                            offsetX.animateTo(0f, spring())
                                        }
                                    }
                                },
                                onHorizontalDrag = { change, dragAmount ->
                                    change.consume()
                                    coroutineScope.launch {
                                        offsetX.snapTo(offsetX.value + dragAmount)
                                    }
                                }
                            )
                        }
                        .clickable {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            isFlipped = !isFlipped
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxSize()
                            .shadow(24.dp, RoundedCornerShape(28.dp), ambientColor = Color.Black, spotColor = Color.Black)
                            .border(
                                1.5.dp,
                                when {
                                    offsetX.value > 80f -> Color(0xFF34D399).copy(alpha = (offsetX.value / 300f).coerceIn(0.2f, 1f))
                                    offsetX.value < -80f -> Color(0xFFF87171).copy(alpha = (abs(offsetX.value) / 300f).coerceIn(0.2f, 1f))
                                    else -> Color.White.copy(alpha = 0.15f)
                                },
                                RoundedCornerShape(28.dp)
                            ),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF141416)),
                        shape = RoundedCornerShape(28.dp)
                    ) {
                        if (rotation <= 90f) {
                            // ── FRENTE DO CARD (PERGUNTA) ────────────
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(24.dp)
                                    .verticalScroll(rememberScrollState()),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = currentCard.area.uppercase(),
                                            color = Color(0xFFF59E0B),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            letterSpacing = 1.sp,
                                            modifier = Modifier
                                                .background(Color(0xFFF59E0B).copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                                .padding(horizontal = 10.dp, vertical = 4.dp)
                                        )

                                        if (currentCard.artigoNumero.isNotEmpty()) {
                                            Text(
                                                text = "Art. ${currentCard.artigoNumero}",
                                                color = Color.White.copy(alpha = 0.7f),
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                        }
                                    }

                                    if (currentCard.tema.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(10.dp))
                                        Text(
                                            text = currentCard.tema,
                                            color = Color.White.copy(alpha = 0.5f),
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(24.dp))

                                    Text(
                                        text = currentCard.pergunta,
                                        color = Color.White,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        lineHeight = 28.sp
                                    )

                                    if (currentCard.dica.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(20.dp))
                                        if (showDica) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .background(Color(0xFFFCD34D).copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                                                    .border(1.dp, Color(0xFFFCD34D).copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                                    .padding(12.dp)
                                            ) {
                                                Text(
                                                    text = "💡 Dica: ${currentCard.dica}",
                                                    color = Color(0xFFFDE68A),
                                                    fontSize = 13.sp,
                                                    lineHeight = 18.sp
                                                )
                                            }
                                        } else {
                                            TextButton(
                                                onClick = {
                                                    view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                                    showDica = true
                                                }
                                            ) {
                                                Text(text = "💡 Ver dica", color = Color(0xFFFCD34D), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Toque no card para virar ↺",
                                        color = Color.White.copy(alpha = 0.4f),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        } else {
                            // ── VERSO DO CARD (RESPOSTA) ─────────────
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .graphicsLayer { rotationY = 180f }
                                    .padding(24.dp)
                                    .verticalScroll(rememberScrollState()),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(
                                        text = "RESPOSTA",
                                        color = Color(0xFF34D399),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 1.2.sp
                                    )

                                    Spacer(modifier = Modifier.height(14.dp))

                                    Text(
                                        text = currentCard.resposta,
                                        color = Color.White,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Normal,
                                        lineHeight = 24.sp
                                    )

                                    if (currentCard.baseLegal.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(18.dp))
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .background(Color(0xFF8B0F1A).copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                                .border(1.dp, Color(0xFF8B0F1A).copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                                .padding(12.dp)
                                        ) {
                                            Text(
                                                text = "⚖️ Base Legal: ${currentCard.baseLegal}",
                                                color = Color(0xFFFCA5A5),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                    }

                                    if (currentCard.exemplo.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
                                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                                .padding(12.dp)
                                        ) {
                                            Text(
                                                text = "📖 Exemplo: ${currentCard.exemplo}",
                                                color = Color.White.copy(alpha = 0.85f),
                                                fontSize = 12.sp
                                            )
                                        }
                                    }
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Deslize para classificar ou use os botões abaixo",
                                        color = Color.White.copy(alpha = 0.4f),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // ── DOCK INFERIOR DE AÇÕES (REVISAR / VIRAR / COMPREENDI) ─
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Botão Revisar (Esquerda)
                    Button(
                        onClick = { responder("revisar") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF991B1B)),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(54.dp)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "REVISAR", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Botão Virar (Centro)
                    IconButton(
                        onClick = {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            isFlipped = !isFlipped
                        },
                        modifier = Modifier
                            .size(54.dp)
                            .background(Color.White.copy(alpha = 0.12f), CircleShape)
                            .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Virar",
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Botão Compreendi (Direita)
                    Button(
                        onClick = { responder("compreendido") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(54.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "COMPREENDI", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
