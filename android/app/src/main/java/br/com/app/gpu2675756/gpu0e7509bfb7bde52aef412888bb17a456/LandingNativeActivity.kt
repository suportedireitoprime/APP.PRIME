package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class LandingNativeActivity : ComponentActivity() {

    private val authLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val session = result.data?.getStringExtra("session")
            val intent = Intent().apply {
                putExtra("session", session)
            }
            setResult(Activity.RESULT_OK, intent)
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            LandingNativeScreen(
                onOpenAuth = { mode ->
                    val intent = Intent(this, AuthNativeActivity::class.java).apply {
                        putExtra("mode", mode)
                    }
                    authLauncher.launch(intent)
                },
                onClose = {
                    setResult(Activity.RESULT_CANCELED)
                    finish()
                }
            )
        }
    }
}

data class FeatureItem(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val accentColor: Color
)

data class FaqData(
    val question: String,
    val answer: String
)

@Composable
fun LandingNativeScreen(
    onOpenAuth: (String) -> Unit,
    onClose: () -> Unit
) {
    val darkBg = Color(0xFF0D0D0D)
    val cardBg = Color(0xFF18181B)
    val purplePrimary = Color(0xFF9333EA)
    val goldAccent = Color(0xFFF59E0B)

    val scrollState = rememberScrollState()

    val features = listOf(
        FeatureItem(
            "Vade Mecum 100% Atualizado",
            "Códigos e leis do Planalto com grifos nativos, áudio sincronizado e busca instantânea sem travamentos.",
            Icons.Default.MenuBook,
            goldAccent
        ),
        FeatureItem(
            "Me Explique com IA Visual",
            "Aponte a câmera para qualquer doutrina, artigo ou caderno e tire dúvidas jurídicas em tempo real.",
            Icons.Default.CameraAlt,
            purplePrimary
        ),
        FeatureItem(
            "OAB 1ª e 2ª Fase & Concursos",
            "Milhares de questões comentadas, simulados de peças práticas e acompanhamento de desempenho.",
            Icons.Default.Gavel,
            Color(0xFF3B82F6)
        ),
        FeatureItem(
            "Flashcards e Repetição Espaçada",
            "Memorização ativa dos artigos mais cobrados sem decoreba inútil.",
            Icons.Default.Psychology,
            Color(0xFF10B981)
        ),
        FeatureItem(
            "Leis Cantadas & Áudio em Segundo Plano",
            "Estude no trânsito ou na academia com narrações completas e mnemônicos musicais.",
            Icons.Default.Headphones,
            Color(0xFFEC4899)
        )
    )

    val universities = listOf(
        "USP", "FGV Direito", "PUC-SP", "Mackenzie", "UERJ", "UFRJ", "UFMG", "UnB", "UFPE", "PUC-RS", "UFSC"
    )

    val faqs = listOf(
        FaqData("O app é gratuito para começar?", "Sim, você pode testar e explorar gratuitamente. Para recursos ilimitados, o app conta com o plano PRIME super acessível."),
        FaqData("A legislação é realmente atualizada?", "Sim! Todas as leis são sincronizadas diretamente com o Diário Oficial e o Planalto, mantendo você seguro para provas e prática."),
        FaqData("Funciona offline?", "Sim! O Vade Mecum, as notas salvas e os flashcards contam com armazenamento nativo no dispositivo para você estudar sem conexão.")
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(darkBg)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(bottom = 110.dp) // Espaço para a barra de ação fixa
        ) {
            // Header Top Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                Brush.linearGradient(
                                    listOf(purplePrimary, Color(0xFF6B21A8))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Balance,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "DIREITO PRIME",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp,
                        letterSpacing = 1.sp
                    )
                }

                Text(
                    text = "Entrar",
                    color = goldAccent,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onOpenAuth("login") }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }

            // Hero Section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Badge
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color(0x22F59E0B),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x66F59E0B)),
                    modifier = Modifier.padding(bottom = 16.dp)
                ) {
                    Text(
                        text = "O ECOSSISTEMA JURÍDICO Nº 1 DO BRASIL",
                        color = goldAccent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }

                Text(
                    text = "Sua Aprovação na Faculdade e na OAB Começa Aqui",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    textAlign = TextAlign.Center,
                    lineHeight = 34.sp
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Vade Mecum fluido a 120fps, IA jurídica visual, áudios em segundo plano e simulados personalizados.",
                    color = Color(0xFFA1A1AA),
                    fontSize = 15.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 22.sp
                )
            }

            // Carrossel de Universidades
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp)
            ) {
                Text(
                    text = "UTILIZADO POR ALUNOS E ADVOGADOS DE TODO O BRASIL",
                    color = Color(0xFF71717A),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                Row(
                    modifier = Modifier
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    universities.forEach { uni ->
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = cardBg,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF27272A))
                        ) {
                            Text(
                                text = uni,
                                color = Color(0xFFE4E4E7),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Cards de Recursos Principais
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "TUDO QUE VOCÊ PRECISA EM UM SÓ LUGAR",
                    color = goldAccent,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp
                )

                features.forEach { feat ->
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = cardBg,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF27272A)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(18.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(feat.accentColor.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = feat.icon,
                                    contentDescription = null,
                                    tint = feat.accentColor,
                                    modifier = Modifier.size(24.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = feat.title,
                                    color = Color.White,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 16.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = feat.description,
                                    color = Color(0xFFA1A1AA),
                                    fontSize = 13.sp,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // FAQ Interativo
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
            ) {
                Text(
                    text = "PERGUNTAS FREQUENTES",
                    color = goldAccent,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                faqs.forEach { faq ->
                    var expanded by remember { mutableStateOf(false) }

                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = cardBg,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF27272A)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .clickable { expanded = !expanded }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = faq.question,
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                    contentDescription = null,
                                    tint = Color(0xFFA1A1AA)
                                )
                            }

                            AnimatedVisibility(visible = expanded) {
                                Text(
                                    text = faq.answer,
                                    color = Color(0xFFA1A1AA),
                                    fontSize = 13.sp,
                                    lineHeight = 18.sp,
                                    modifier = Modifier.padding(top = 10.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Rodapé Fixo com Botão de Ação CTA
        Surface(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth(),
            color = Color(0xF00D0D0D),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF27272A))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Button(
                    onClick = { onOpenAuth("signup") },
                    colors = ButtonDefaults.buttonColors(containerColor = purplePrimary),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    Text(
                        text = "Começar Agora Gratuitamente",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Explorar o app sem conta",
                    color = Color(0xFFA1A1AA),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .clickable { onClose() }
                        .padding(vertical = 4.dp)
                )
            }
        }
    }
}
