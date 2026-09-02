package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class FlashcardsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val isStudySession = intent.getBooleanExtra("isStudySession", false)
        val category = intent.getStringExtra("category") ?: ""
        
        setContent {
            FlashcardsNativeScreen(
                isStudySession = isStudySession,
                category = category,
                onClose = { finish() }
            )
        }
    }
}

@Composable
fun FlashcardsNativeScreen(isStudySession: Boolean, category: String, onClose: () -> Unit) {
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
                
                // Placeholder for 3D card
                Box(
                    modifier = Modifier
                        .width(280.dp)
                        .height(400.dp)
                        .background(Color(0xFF2C9570), shape = RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "Cartão 3D Nativo (Em Breve)", color = Color.White, fontWeight = FontWeight.Bold)
                }
            } else {
                Text(
                    text = "Gráficos e Histórico Nativos",
                    color = Color.Gray,
                    fontSize = 16.sp
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
