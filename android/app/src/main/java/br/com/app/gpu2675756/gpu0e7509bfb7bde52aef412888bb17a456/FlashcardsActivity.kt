package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import android.view.HapticFeedbackConstants
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.io.BufferedReader
import java.io.InputStreamReader
import kotlin.math.abs
import kotlin.math.roundToInt
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class FlashcardsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val isStudySession = intent.getBooleanExtra("isStudySession", false)
        val category = intent.getStringExtra("category") ?: ""
        val accessToken = intent.getStringExtra("accessToken") ?: ""
        
        setContent {
            FlashcardsNativeScreen(
                isStudySession = isStudySession,
                category = category,
                accessToken = accessToken,
                onClose = { 
                    val resultIntent = android.content.Intent().apply {
                        putExtra("cardsRevisados", 5) // Mock de valor final
                        putExtra("totalCards", 10)
                    }
                    setResult(android.app.Activity.RESULT_OK, resultIntent)
                    finish() 
                }
            )
        }
    }
}

@Composable
fun FlashcardsNativeScreen(isStudySession: Boolean, category: String, accessToken: String, onClose: () -> Unit) {
    var serverStatus by remember { mutableStateOf("Conectando ao Supabase Nativamente...") }
    val coroutineScope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) {
        coroutineScope.launch(Dispatchers.IO) {
            try {
                val url = URL("https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/flashcards?select=id,frente&limit=1")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("apikey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0")
                connection.setRequestProperty("Authorization", "Bearer $accessToken")
                
                val responseCode = connection.responseCode
                if (responseCode == 200) {
                    val reader = BufferedReader(InputStreamReader(connection.inputStream))
                    val response = reader.readText()
                    reader.close()
                    withContext(Dispatchers.Main) {
                        serverStatus = "Supabase Conectado! Dados: $response"
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        serverStatus = "Erro HTTP: $responseCode"
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    serverStatus = "Erro de Rede: ${e.message}"
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0D0D))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1E1E1E), shape = RoundedCornerShape(24.dp))
                .padding(32.dp)
        ) {
            Text(
                text = if (isStudySession) "Sessão Nativa de Flashcards" else "Dashboard Nativo",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            if (isStudySession) {
                Text(
                    text = "Categoria: $category",
                    color = Color.Gray,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(32.dp))
                
                SwipeableCard()
                
            } else {
                Text(
                    text = "Gráficos e Histórico Nativos",
                    color = Color.Gray,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = serverStatus,
                    color = Color.Green,
                    fontSize = 12.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(
                onClick = onClose,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10b981)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(text = "Voltar para o App (Web)", color = Color.White)
            }
        }
    }
}

@Composable
fun SwipeableCard() {
    val offsetX = remember { Animatable(0f) }
    val offsetY = remember { Animatable(0f) }
    val rotation = remember { Animatable(0f) }
    val coroutineScope = rememberCoroutineScope()
    val view = LocalView.current

    var cardText by remember { mutableStateOf("Cartão Nativo\nArraste-me!") }
    var cardColor by remember { mutableStateOf(Color(0xFF2C9570)) }

    Box(
        modifier = Modifier
            .offset { IntOffset(offsetX.value.roundToInt(), offsetY.value.roundToInt()) }
            .graphicsLayer {
                rotationZ = rotation.value
            }
            .width(280.dp)
            .height(400.dp)
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragEnd = {
                        coroutineScope.launch {
                            val targetX = offsetX.value
                            if (abs(targetX) > 300f) {
                                // Swipe finalizado - Haptic Forte
                                view.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                                
                                val isRight = targetX > 0
                                cardText = if (isRight) "Fácil!" else "Difícil!"
                                cardColor = if (isRight) Color(0xFF10b981) else Color(0xFFef4444)

                                // Animação de saída
                                offsetX.animateTo(if (isRight) 1000f else -1000f)
                                
                                // Reset rápido para simular próximo cartão
                                kotlinx.coroutines.delay(300)
                                offsetX.snapTo(0f)
                                offsetY.snapTo(0f)
                                rotation.snapTo(0f)
                                cardText = "Próximo Cartão\nArraste-me!"
                                cardColor = Color(0xFF2C9570)
                            } else {
                                // Cancela swipe
                                offsetX.animateTo(0f)
                                offsetY.animateTo(0f)
                                rotation.animateTo(0f)
                            }
                        }
                    },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        coroutineScope.launch {
                            offsetX.snapTo(offsetX.value + dragAmount.x)
                            offsetY.snapTo(offsetY.value + dragAmount.y)
                            rotation.snapTo(offsetX.value / 20)
                            
                            // Micro-haptic durante o drag baseando na posição
                            if (abs(offsetX.value) % 150 < 10) {
                                view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            }
                        }
                    }
                )
            }
            .background(cardColor, shape = RoundedCornerShape(16.dp)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = cardText,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 20.sp,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
    }
}
