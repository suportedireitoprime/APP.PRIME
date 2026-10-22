package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class AuthNativeActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val initialMode = intent.getStringExtra("mode") ?: "login"

        setContent {
            AuthNativeScreen(
                initialMode = initialMode,
                onSuccess = { sessionJson ->
                    val resultIntent = Intent().apply {
                        putExtra("session", sessionJson)
                    }
                    setResult(Activity.RESULT_OK, resultIntent)
                    finish()
                },
                onClose = {
                    setResult(Activity.RESULT_CANCELED)
                    finish()
                }
            )
        }
    }
}

private const val SUPABASE_URL = "https://dnjrgpldcwcpoywamorr.supabase.co"
private const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthNativeScreen(
    initialMode: String,
    onSuccess: (String) -> Unit,
    onClose: () -> Unit
) {
    var mode by remember { mutableStateOf(if (initialMode == "signup") "signup" else if (initialMode == "forgot") "forgot" else "login") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    val coroutineScope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()

    val darkBg = Color(0xFF0D0D0D)
    val cardBg = Color(0xFF18181B)
    val purplePrimary = Color(0xFF9333EA)
    val goldAccent = Color(0xFFF59E0B)

    fun executarAuth() {
        if (email.isBlank()) {
            errorMessage = "Digite seu e-mail"
            return
        }
        if (mode != "forgot" && password.isBlank()) {
            errorMessage = "Digite sua senha"
            return
        }
        if (mode == "signup" && name.isBlank()) {
            errorMessage = "Digite seu nome"
            return
        }

        errorMessage = null
        successMessage = null
        isLoading = true

        coroutineScope.launch {
            try {
                val resultado = withContext(Dispatchers.IO) {
                    when (mode) {
                        "login" -> {
                            val url = URL("$SUPABASE_URL/auth/v1/token?grant_type=password")
                            val conn = url.openConnection() as HttpURLConnection
                            conn.requestMethod = "POST"
                            conn.setRequestProperty("Content-Type", "application/json")
                            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
                            conn.doOutput = true

                            val json = JSONObject().apply {
                                put("email", email.trim())
                                put("password", password)
                            }

                            OutputStreamWriter(conn.outputStream).use { it.write(json.toString()) }
                            val code = conn.responseCode
                            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                            val response = BufferedReader(InputStreamReader(stream)).use { it.readText() }

                            if (code in 200..299) {
                                Pair(true, response)
                            } else {
                                val errObj = JSONObject(response)
                                val desc = errObj.optString("error_description", errObj.optString("msg", "Erro ao entrar"))
                                Pair(false, desc)
                            }
                        }
                        "signup" -> {
                            val url = URL("$SUPABASE_URL/auth/v1/signup")
                            val conn = url.openConnection() as HttpURLConnection
                            conn.requestMethod = "POST"
                            conn.setRequestProperty("Content-Type", "application/json")
                            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
                            conn.doOutput = true

                            val json = JSONObject().apply {
                                put("email", email.trim())
                                put("password", password)
                                val data = JSONObject().apply {
                                    put("display_name", name.trim())
                                }
                                put("data", data)
                            }

                            OutputStreamWriter(conn.outputStream).use { it.write(json.toString()) }
                            val code = conn.responseCode
                            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                            val response = BufferedReader(InputStreamReader(stream)).use { it.readText() }

                            if (code in 200..299) {
                                Pair(true, response)
                            } else {
                                val errObj = JSONObject(response)
                                val desc = errObj.optString("msg", errObj.optString("error_description", "Erro ao cadastrar"))
                                Pair(false, desc)
                            }
                        }
                        "forgot" -> {
                            val url = URL("$SUPABASE_URL/auth/v1/recover")
                            val conn = url.openConnection() as HttpURLConnection
                            conn.requestMethod = "POST"
                            conn.setRequestProperty("Content-Type", "application/json")
                            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
                            conn.doOutput = true

                            val json = JSONObject().apply {
                                put("email", email.trim())
                            }

                            OutputStreamWriter(conn.outputStream).use { it.write(json.toString()) }
                            val code = conn.responseCode
                            if (code in 200..299) {
                                Pair(true, "E-mail de recuperação enviado com sucesso!")
                            } else {
                                Pair(false, "Não foi possível enviar o e-mail de recuperação.")
                            }
                        }
                        else -> Pair(false, "Modo inválido")
                    }
                }

                isLoading = false
                if (resultado.first) {
                    if (mode == "forgot") {
                        successMessage = resultado.second
                    } else {
                        onSuccess(resultado.second)
                    }
                } else {
                    errorMessage = resultado.second
                }
            } catch (e: Exception) {
                isLoading = false
                errorMessage = "Falha de conexão: ${e.localizedMessage ?: "Tente novamente."}"
            }
        }
    }

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
                .padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header: Botão Fechar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onClose,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF27272A))
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Fechar",
                        tint = Color.White
                    )
                }

                Text(
                    text = "DIREITO PRIME",
                    color = goldAccent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp
                )

                Spacer(modifier = Modifier.size(48.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Ícone e Título
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF9333EA), Color(0xFF6B21A8))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (mode == "signup") Icons.Default.PersonAdd else if (mode == "forgot") Icons.Default.LockReset else Icons.Default.Lock,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = when (mode) {
                    "signup" -> "Crie sua Conta"
                    "forgot" -> "Recuperar Senha"
                    else -> "Bem-vindo de Volta"
                },
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center
            )

            Text(
                text = when (mode) {
                    "signup" -> "Acesse o maior ecossistema de estudos jurídicos do Brasil."
                    "forgot" -> "Digite seu e-mail para receber as instruções de recuperação."
                    else -> "Entre para acessar seus cadernos, questões e Vade Mecum."
                },
                color = Color(0xFFA1A1AA),
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Segmented Control (Entrar vs Cadastrar)
            if (mode != "forgot") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(cardBg)
                        .padding(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (mode == "login") purplePrimary else Color.Transparent)
                            .clickable { mode = "login" }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Entrar",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (mode == "signup") purplePrimary else Color.Transparent)
                            .clickable { mode = "signup" }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Criar Conta",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
                Spacer(modifier = Modifier.height(20.dp))
            }

            // Mensagens de Alerta / Erro
            errorMessage?.let { msg ->
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0x33EF4444),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x66EF4444)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Text(
                        text = msg,
                        color = Color(0xFFFCA5A5),
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }

            successMessage?.let { msg ->
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0x3310B981),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x6610B981)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Text(
                        text = msg,
                        color = Color(0xFF6EE7B7),
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }

            // Campo Nome (Apenas Cadastro)
            if (mode == "signup") {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome Completo", color = Color(0xFFA1A1AA)) },
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFFA1A1AA))
                    },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = purplePrimary,
                        unfocusedBorderColor = Color(0xFF3F3F46),
                        focusedContainerColor = cardBg,
                        unfocusedContainerColor = cardBg
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(14.dp))
            }

            // Campo E-mail
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Seu E-mail", color = Color(0xFFA1A1AA)) },
                leadingIcon = {
                    Icon(Icons.Default.Email, contentDescription = null, tint = Color(0xFFA1A1AA))
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = if (mode == "forgot") ImeAction.Done else ImeAction.Next
                ),
                keyboardActions = KeyboardActions(
                    onNext = { focusManager.moveFocus(FocusDirection.Down) },
                    onDone = {
                        focusManager.clearFocus()
                        executarAuth()
                    }
                ),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = purplePrimary,
                    unfocusedBorderColor = Color(0xFF3F3F46),
                    focusedContainerColor = cardBg,
                    unfocusedContainerColor = cardBg
                ),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )

            // Campo Senha (Login e Cadastro)
            if (mode != "forgot") {
                Spacer(modifier = Modifier.height(14.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Sua Senha", color = Color(0xFFA1A1AA)) },
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFFA1A1AA))
                    },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                imageVector = if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = null,
                                tint = Color(0xFFA1A1AA)
                            )
                        }
                    },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            executarAuth()
                        }
                    ),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = purplePrimary,
                        unfocusedBorderColor = Color(0xFF3F3F46),
                        focusedContainerColor = cardBg,
                        unfocusedContainerColor = cardBg
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                if (mode == "login") {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        contentAlignment = Alignment.CenterEnd
                    ) {
                        Text(
                            text = "Esqueceu sua senha?",
                            color = goldAccent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.clickable { mode = "forgot" }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Botão Principal de Submissão
            Button(
                onClick = { executarAuth() },
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = purplePrimary),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        color = Color.White,
                        modifier = Modifier.size(22.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        text = when (mode) {
                            "signup" -> "Cadastrar Gratuitamente"
                            "forgot" -> "Enviar Link de Recuperação"
                            else -> "Entrar na Conta"
                        },
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }

            if (mode == "forgot") {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Voltar para o Login",
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { mode = "login" }
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Termos e Privacidade
            Text(
                text = "Ao continuar, você concorda com os Termos de Uso e Política de Privacidade do Direito Prime.",
                color = Color(0xFF71717A),
                fontSize = 11.sp,
                textAlign = TextAlign.Center,
                lineHeight = 15.sp,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }
    }
}
