package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Brush

@Composable
fun HomeScreen(
    nome: String,
    perfilLabel: String,
    unreadCount: Int,
    onNavigate: (String) -> Unit
) {
    val darkGradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF8B0000), // Dark Red
            Color(0xFF4A0000),
            Color(0xFF000000)
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(darkGradient)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Color.Gray)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = nome,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp
                        )
                        Text(
                            text = perfilLabel,
                            color = Color.LightGray,
                            fontSize = 14.sp
                        )
                    }
                }
                
                Row {
                    // Notification Icon
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.5f))
                            .clickable { },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🔔", color = Color.White)
                        if (unreadCount > 0) {
                            Badge(modifier = Modifier.align(Alignment.TopEnd)) {
                                Text(unreadCount.toString())
                            }
                        }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    // Menu Icon
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.5f))
                            .clickable { },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("☰", color = Color.White)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Hero Section (Owl, Scales)
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Here we would use an AsyncImage or painterResource for the Owl logo
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape)
                        .background(Color.DarkGray)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Estudos Jurídicos",
                    color = Color.White,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "USO PROFISSIONAL",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 14.sp,
                    letterSpacing = 2.sp
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Search Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.Black.copy(alpha = 0.6f))
                    .clickable { onNavigate("/search") },
                contentAlignment = Alignment.CenterStart
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🔍", color = Color.Gray)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Pesquise súmulas...", color = Color.Gray)
                }
                
                Button(
                    onClick = { },
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .padding(end = 8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935))
                ) {
                    Text("PESQUISAR", color = Color.White)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Quick Actions Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                QuickActionButton("Me Explique", "📸", Color(0xFFE65100)) { onNavigate("/me-explique") }
                QuickActionButton("Flashcards", "📚", Color(0xFF00C853)) { onNavigate("/flashcards") }
                QuickActionButton("Questões", "✓", Color(0xFFE53935)) { onNavigate("/questoes") }
                QuickActionButton("Desktop", "💻", Color(0xFF2962FF)) { onNavigate("/desktop") }
            }
        }
    }
}

@Composable
fun QuickActionButton(
    label: String,
    icon: String,
    iconColor: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .width(80.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.Black.copy(alpha = 0.5f))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp)
    ) {
        Text(text = icon, fontSize = 24.sp, color = iconColor)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = label.uppercase(),
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
