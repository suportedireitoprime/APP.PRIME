package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.R

data class NativeBookData(
    val id: String,
    val title: String,
    val author: String,
    val year: String,
    val subtitle: String
)

@Composable
fun HomeScreen(
    nome: String,
    perfilLabel: String,
    unreadCount: Int,
    onNavigate: (String) -> Unit,
    onSearch: () -> Unit = { onNavigate("/search") },
    onOpenSidebar: () -> Unit = {},
    onOpenNotifications: () -> Unit = {}
) {
    val scrollState = rememberScrollState()

    val darkBackgroundGradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF8B0F1A), // Vinho escuro Direito Prime
            Color(0xFF4A050B),
            Color(0xFF1F0306),
            Color(0xFF0D0D0D),
            Color(0xFF0A0A0A)
        )
    )

    val sampleBooks = remember {
        listOf(
            NativeBookData("livro_1", "Como as Democracias Morrem", "Steven Levitsky & Daniel Ziblatt", "2018", "Best-seller mundial"),
            NativeBookData("livro_2", "O Último Dia de um Condenado", "Victor Hugo", "1829", "Clássico humanitário"),
            NativeBookData("livro_3", "Dos Delitos e das Penas", "Cesare Beccaria", "1764", "Marco do direito penal"),
            NativeBookData("livro_4", "O Caso dos Exploradores", "Lon L. Fuller", "1949", "Filosofia jurídica")
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0D0D))
    ) {
        // Conteúdo com Scroll
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(darkBackgroundGradient)
                .verticalScroll(scrollState)
                .padding(bottom = 100.dp) // Espaço para a bottom navigation bar
        ) {
            // ── TOP BAR: Perfil, Notificação & Menu ─────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onNavigate("/meu-espaco") }
                ) {
                    // Avatar Circular com borda branca
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .border(2.dp, Color.White, CircleShape)
                            .background(Color(0xFF660000)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (nome.isNotBlank()) nome.take(1).uppercase() else "W",
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = 22.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = nome.uppercase(),
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 17.sp,
                                letterSpacing = 0.5.sp
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "🪶", fontSize = 14.sp)
                        }
                        Text(
                            text = perfilLabel,
                            color = Color(0xFFE2E8F0),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // Botões do Topo Direito (Sino e Menu)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Sino com badge
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.65f))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                            .clickable { onOpenNotifications() },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🔔", fontSize = 18.sp)
                        if (unreadCount > 0) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .offset(x = 4.dp, y = (-2).dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE53935))
                                    .padding(horizontal = 5.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = if (unreadCount > 99) "99+" else unreadCount.toString(),
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    // Botão Hambúrguer
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.65f))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                            .clickable { onOpenSidebar() },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("☰", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // ── HERO CENTRAL: Themis, Coruja & Estudos Jurídicos ─────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Ilustração oficial Themis & Coruja
                Image(
                    painter = painterResource(id = R.drawable.logo_prime),
                    contentDescription = "Direito Prime",
                    modifier = Modifier
                        .height(115.dp)
                        .padding(vertical = 4.dp),
                    contentScale = ContentScale.Fit
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Estudos Jurídicos",
                    color = Color.White,
                    fontSize = 25.sp,
                    fontStyle = FontStyle.Italic,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.5).sp
                )

                Text(
                    text = "USO PROFISSIONAL",
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 2.5.sp
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // ── BARRA DE PESQUISA ────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(58.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color.Black.copy(alpha = 0.55f))
                    .border(1.dp, Color(0xFF8B0F1A).copy(alpha = 0.5f), RoundedCornerShape(18.dp))
                    .clickable { onSearch() },
                contentAlignment = Alignment.CenterStart
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(start = 14.dp, end = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("🔍", fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Pesquise leis, artigos, súmulas...",
                            color = Color.White.copy(alpha = 0.65f),
                            fontSize = 14.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Botão PESQUISAR Vermelho
                    Box(
                        modifier = Modifier
                            .height(44.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color(0xFFB71C1C))
                            .clickable { onSearch() }
                            .padding(horizontal = 18.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "PESQUISAR",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ── GRID DE 4 AÇÕES RÁPIDAS (Cards Táteis) ───────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickActionCard(
                    modifier = Modifier.weight(1f),
                    label = "ME EXPLIQUE",
                    icon = "📷",
                    iconColor = Color(0xFFF97316),
                    onClick = { onNavigate("/me-explique") }
                )
                QuickActionCard(
                    modifier = Modifier.weight(1f),
                    label = "FLASHCARDS",
                    icon = "🗂️",
                    iconColor = Color(0xFF34D399),
                    onClick = { onNavigate("/flashcards") }
                )
                QuickActionCard(
                    modifier = Modifier.weight(1f),
                    label = "QUESTÕES",
                    icon = "☑️",
                    iconColor = Color(0xFFF87171),
                    onClick = { onNavigate("/questoes") }
                )
                QuickActionCard(
                    modifier = Modifier.weight(1f),
                    label = "DESKTOP",
                    icon = "💻",
                    iconColor = Color(0xFF3B82F6),
                    onClick = { onNavigate("/desktop") }
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // ── SEÇÃO: RECOMENDAÇÃO DE LIVRO ────────────────────────
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .width(4.dp)
                            .height(20.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(Color(0xFFE53935))
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "RECOMENDAÇÃO DE LIVRO",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                        Text(
                            text = "clássicos e obras do Direito",
                            color = Color.Gray,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Carrossel Horizontal de Livros
                val bookScrollState = rememberScrollState()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(bookScrollState)
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    sampleBooks.forEach { book ->
                        BookCard(book = book, onClick = { onNavigate("/biblioteca") })
                    }
                }
            }
        }

        // ── BOTTOM NAVIGATION BAR FIXA (Com botão Vade Mecum elevado) ─
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .navigationBarsPadding()
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color(0xFF0F0F0F),
                tonalElevation = 8.dp,
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(topStart = 22.dp, topEnd = 22.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(72.dp)
                        .padding(horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    BottomNavItem(icon = "📜", label = "Blog", onClick = { onNavigate("/blog") })
                    BottomNavItem(icon = "💬", label = "Chat", onClick = { onNavigate("/chat") })

                    // Espaçador para o botão central circular flutuante
                    Spacer(modifier = Modifier.width(68.dp))

                    BottomNavItem(icon = "🔨", label = "Ferramentas", onClick = { onNavigate("/ferramentas") })
                    BottomNavItem(icon = "💊", label = "Pílulas", onClick = { onNavigate("/pilulas") })
                }
            }

            // Botão Circular Flutuante do Vade Mecum (Central e Elevado)
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-20).dp)
                    .size(68.dp)
                    .shadow(16.dp, CircleShape)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(Color(0xFFE53935), Color(0xFF8B0000))
                        )
                    )
                    .border(2.dp, Color.White.copy(alpha = 0.3f), CircleShape)
                    .clickable { onNavigate("/vade-mecum") },
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("⚖️", fontSize = 26.sp)
                }
            }
        }
    }
}

@Composable
fun QuickActionCard(
    modifier: Modifier = Modifier,
    label: String,
    icon: String,
    iconColor: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(76.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color.Black.copy(alpha = 0.5f))
            .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(18.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(text = icon, fontSize = 22.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.2).sp
            )
        }
    }
}

@Composable
fun BookCard(
    book: NativeBookData,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .width(200.dp)
            .height(130.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.horizontalGradient(
                    colors = listOf(Color(0xFF1E0709), Color(0xFF33090F), Color(0xFF140204))
                )
            )
            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = book.title,
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )

                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("↗", color = Color.White, fontSize = 14.sp)
                }
            }

            Column {
                Text(
                    text = book.author,
                    color = Color.LightGray,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = book.year,
                    color = Color(0xFFE53935),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun BottomNavItem(
    icon: String,
    label: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .width(58.dp)
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp)
    ) {
        Text(text = icon, fontSize = 20.sp)
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = label,
            color = Color.White.copy(alpha = 0.85f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}
