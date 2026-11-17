package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.graphics.Bitmap
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.pdf.PdfRenderer
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.util.LruCache
import android.view.HapticFeedbackConstants
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class PdfViewerActivity : ComponentActivity() {

    private var fileDescriptor: ParcelFileDescriptor? = null
    private var pdfRenderer: PdfRenderer? = null
    private val bitmapCache = object : LruCache<Int, Bitmap>(8) {
        override fun entryRemoved(evicted: Boolean, key: Int?, oldValue: Bitmap?, newValue: Bitmap?) {
            // Permite reciclagem eficiente de páginas fora da tela
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        val pdfUrl = intent.getStringExtra("pdf_url") ?: ""
        val pdfTitle = intent.getStringExtra("pdf_title") ?: "Documento PDF"
        val initialPage = intent.getIntExtra("initial_page", 1).coerceAtLeast(1)
        val initialDarkMode = intent.getBooleanExtra("is_dark_mode", false)

        setContent {
            PdfViewerScreen(
                pdfUrl = pdfUrl,
                title = pdfTitle,
                initialPage = initialPage,
                initialDarkMode = initialDarkMode,
                onBack = { finish() },
                renderPageBitmap = { pageIndex, isDark ->
                    renderPage(pageIndex, isDark)
                },
                getPageCount = { pdfRenderer?.pageCount ?: 0 },
                initPdf = { url, onReady, onError ->
                    initRenderer(url, onReady, onError)
                }
            )
        }
    }

    private suspend fun initRenderer(urlStr: String, onReady: (Int) -> Unit, onError: (String) -> Unit) {
        withContext(Dispatchers.IO) {
            try {
                val file = if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
                    val cacheFile = File(cacheDir, "doc_${urlStr.hashCode()}.pdf")
                    if (!cacheFile.exists() || cacheFile.length() == 0L) {
                        val connection = URL(urlStr).openConnection() as HttpURLConnection
                        connection.connectTimeout = 15000
                        connection.readTimeout = 30000
                        connection.connect()
                        connection.inputStream.use { input ->
                            FileOutputStream(cacheFile).use { output ->
                                input.copyTo(output)
                            }
                        }
                    }
                    cacheFile
                } else {
                    File(urlStr.removePrefix("file://"))
                }

                if (!file.exists()) {
                    withContext(Dispatchers.Main) { onError("Arquivo não encontrado") }
                    return@withContext
                }

                fileDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
                pdfRenderer = PdfRenderer(fileDescriptor!!)
                val count = pdfRenderer?.pageCount ?: 0

                withContext(Dispatchers.Main) {
                    onReady(count)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    onError(e.message ?: "Erro ao abrir PDF")
                }
            }
        }
    }

    private fun renderPage(pageIndex: Int, isDark: Boolean): Bitmap? {
        val renderer = pdfRenderer ?: return null
        if (pageIndex < 0 || pageIndex >= renderer.pageCount) return null

        val cacheKey = pageIndex * 2 + if (isDark) 1 else 0
        synchronized(bitmapCache) {
            val cached = bitmapCache.get(cacheKey)
            if (cached != null && !cached.isRecycled) return cached
        }

        return synchronized(renderer) {
            var page: PdfRenderer.Page? = null
            try {
                page = renderer.openPage(pageIndex)
                val density = resources.displayMetrics.density
                // Renderização em Ultra HD / Print: garante qualidade vetorial máxima sem pixelização
                val width = (page.width * density * 2.2f).toInt().coerceAtLeast(1800)
                val height = (page.height * density * 2.2f).toInt().coerceAtLeast(2400)

                val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT)

                val finalBitmap = if (isDark) {
                    val darkBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    val canvas = android.graphics.Canvas(darkBitmap)
                    val paint = Paint()
                    val cm = ColorMatrix(
                        floatArrayOf(
                            -1f, 0f, 0f, 0f, 255f,
                            0f, -1f, 0f, 0f, 255f,
                            0f, 0f, -1f, 0f, 255f,
                            0f, 0f, 0f, 1f, 0f
                        )
                    )
                    paint.colorFilter = ColorMatrixColorFilter(cm)
                    canvas.drawBitmap(bitmap, 0f, 0f, paint)
                    bitmap.recycle()
                    darkBitmap
                } else {
                    bitmap
                }

                synchronized(bitmapCache) {
                    bitmapCache.put(cacheKey, finalBitmap)
                }
                finalBitmap
            } catch (_: Exception) {
                null
            } finally {
                page?.close()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            pdfRenderer?.close()
            fileDescriptor?.close()
            bitmapCache.evictAll()
        } catch (_: Exception) {}
    }
}

@Composable
fun PdfViewerScreen(
    pdfUrl: String,
    title: String,
    initialPage: Int,
    initialDarkMode: Boolean,
    onBack: () -> Unit,
    renderPageBitmap: (Int, Boolean) -> Bitmap?,
    getPageCount: () -> Int,
    initPdf: suspend (String, (Int) -> Unit, (String) -> Unit) -> Unit
) {
    val view = LocalView.current
    var isDarkMode by remember { mutableStateOf(initialDarkMode) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var pageCount by remember { mutableStateOf(0) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    // Zoom e Pan
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    val transformState = rememberTransformableState { zoomChange, offsetChange, _ ->
        scale = (scale * zoomChange).coerceIn(1f, 4f)
        if (scale > 1f) {
            offset += offsetChange
        } else {
            offset = Offset.Zero
        }
    }

    LaunchedEffect(pdfUrl) {
        initPdf(
            pdfUrl,
            { count ->
                pageCount = count
                isLoading = false
                if (initialPage > 1 && initialPage <= count) {
                    scope.launch {
                        listState.scrollToItem(initialPage - 1)
                    }
                }
            },
            { err ->
                errorMessage = err
                isLoading = false
            }
        )
    }

    val currentPage by remember {
        derivedStateOf {
            (listState.firstVisibleItemIndex + 1).coerceAtMost(pageCount.coerceAtLeast(1))
        }
    }

    val bgColor = if (isDarkMode) Color(0xFF0D0D0D) else Color(0xFFF3F4F6)
    val headerColor = if (isDarkMode) Color(0xFF141416) else Color(0xFFFFFFFF)
    val textColor = if (isDarkMode) Color.White else Color(0xFF18181B)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(bgColor)
    ) {
        if (isLoading) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(
                    color = Color(0xFFEAB308),
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Carregando páginas...",
                    color = Color.Gray,
                    fontSize = 14.sp
                )
            }
        } else if (errorMessage != null) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = errorMessage ?: "Erro ao abrir PDF",
                    color = Color.Red,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onBack,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF27272A))
                ) {
                    Text("Voltar", color = Color.White)
                }
            }
        } else {
            // Lista Virtualizada de Páginas com zoom contínuo
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = 90.dp)
                    .transformable(state = transformState)
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                        translationX = offset.x
                        translationY = offset.y
                    }
            ) {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 90.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    items(pageCount) { pageIndex ->
                        var pageBitmap by remember(pageIndex, isDarkMode) {
                            mutableStateOf<Bitmap?>(null)
                        }

                        LaunchedEffect(pageIndex, isDarkMode) {
                            withContext(Dispatchers.IO) {
                                val bmp = renderPageBitmap(pageIndex, isDarkMode)
                                withContext(Dispatchers.Main) {
                                    pageBitmap = bmp
                                }
                            }
                        }

                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.96f)
                                .aspectRatio(0.707f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isDarkMode) Color(0xFF18181B) else Color.White)
                                .border(1.dp, if (isDarkMode) Color(0xFF27272A) else Color(0xFFE4E4E7), RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            val bmp = pageBitmap
                            if (bmp != null && !bmp.isRecycled) {
                                Image(
                                    bitmap = bmp.asImageBitmap(),
                                    contentDescription = "Página ${pageIndex + 1}",
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                CircularProgressIndicator(
                                    color = Color.Gray,
                                    modifier = Modifier.size(28.dp),
                                    strokeWidth = 2.dp
                                )
                            }
                        }
                    }
                }
            }
        }

        // Top Header Fixo Premium (HIG / Material 3)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(headerColor.copy(alpha = 0.95f))
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    // Botão Voltar Padrão Premium (48x48dp)
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(if (isDarkMode) Color(0xFF27272A) else Color(0xFFF4F4F5))
                            .clickable {
                                view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                                onBack()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Voltar",
                            tint = textColor,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = title,
                            color = textColor,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (pageCount > 0) {
                            Text(
                                text = "Página $currentPage de $pageCount",
                                color = Color.Gray,
                                fontSize = 12.sp
                            )
                        }
                    }
                }

                // Botão Alternar Modo Noturno
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(if (isDarkMode) Color(0xFF27272A) else Color(0xFFF4F4F5))
                        .clickable {
                            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            isDarkMode = !isDarkMode
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isDarkMode) Icons.Default.LightMode else Icons.Default.DarkMode,
                        contentDescription = "Alternar Modo",
                        tint = if (isDarkMode) Color(0xFFEAB308) else Color(0xFF3F3F46),
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }
    }
}
