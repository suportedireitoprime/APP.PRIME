package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456

import android.animation.Animator
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.webkit.WebView
import android.widget.ImageView
import android.widget.TextView
import androidx.activity.EdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.getcapacitor.BridgeActivity
import br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.R

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Inicializa a Splash Screen nativa (Evita crash no Android 12+)
        val splashScreen = installSplashScreen()
        
        // Mantém a splash screen nativa visível até a nossa animação terminar/preparar
        var isReady = false
        splashScreen.setKeepOnScreenCondition { !isReady }

        EdgeToEdge.enable(this)
        super.onCreate(savedInstanceState)

        // Desabilita as barras de rolagem nativas do WebView
        val webView: WebView? = bridge.webView
        if (webView != null) {
            webView.isVerticalScrollBarEnabled = false
            webView.isHorizontalScrollBarEnabled = false
        }

        // Registra os Plugins Nativos
        registerPlugin(NativeCorePlugin::class.java)
        registerPlugin(NativeAudioPlugin::class.java)
        registerPlugin(NativeFlashcardsPlugin::class.java)

        // Injeta a view customizada da Splash Nativa por cima do WebView
        setupNativeSplash()
        isReady = true
    }

    private fun setupNativeSplash() {
        val root = findViewById<ViewGroup>(android.R.id.content)
        val splashView = LayoutInflater.from(this).inflate(R.layout.activity_splash_custom, root, false)
        root.addView(splashView)

        val logo = splashView.findViewById<ImageView>(R.id.splash_logo)
        val title = splashView.findViewById<TextView>(R.id.splash_title)
        val subtitle = splashView.findViewById<TextView>(R.id.splash_subtitle)

        // Inicial: invisível e posicionado
        logo.alpha = 0f
        logo.scaleX = 0.5f
        logo.scaleY = 0.5f

        title.alpha = 0f
        title.translationY = 50f

        subtitle.alpha = 0f
        subtitle.translationY = 50f

        // Animadores (Logo escala + fade)
        val logoFade = ObjectAnimator.ofFloat(logo, View.ALPHA, 0f, 1f)
        val logoScaleX = ObjectAnimator.ofFloat(logo, View.SCALE_X, 0.5f, 1.05f, 1f)
        val logoScaleY = ObjectAnimator.ofFloat(logo, View.SCALE_Y, 0.5f, 1.05f, 1f)
        
        // Animadores (Título sobe)
        val titleFade = ObjectAnimator.ofFloat(title, View.ALPHA, 0f, 1f)
        val titleMove = ObjectAnimator.ofFloat(title, View.TRANSLATION_Y, 50f, 0f)

        // Animadores (Subtítulo sobe)
        val subFade = ObjectAnimator.ofFloat(subtitle, View.ALPHA, 0f, 1f)
        val subMove = ObjectAnimator.ofFloat(subtitle, View.TRANSLATION_Y, 50f, 0f)

        val set = AnimatorSet()
        set.play(logoFade).with(logoScaleX).with(logoScaleY)
        set.play(titleFade).with(titleMove).after(300)
        set.play(subFade).with(subMove).after(600)

        set.duration = 800
        set.interpolator = DecelerateInterpolator()
        set.start()

        // Após 2.5s, removemos a splash fadeout
        splashView.postDelayed({
            val fadeOut = ObjectAnimator.ofFloat(splashView, View.ALPHA, 1f, 0f)
            fadeOut.duration = 400
            fadeOut.addListener(object : Animator.AnimatorListener {
                override fun onAnimationStart(animation: Animator) {}
                override fun onAnimationEnd(animation: Animator) {
                    root.removeView(splashView)
                }
                override fun onAnimationCancel(animation: Animator) {}
                override fun onAnimationRepeat(animation: Animator) {}
            })
            fadeOut.start()
        }, 2500)
    }
}
