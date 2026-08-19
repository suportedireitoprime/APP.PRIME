package br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Inicializa a Splash Screen nativa (Evita crash no Android 12+ com Theme.SplashScreen)
        SplashScreen.installSplashScreen(this);
        
        // Habilita Edge-to-Edge para suportar Android 15 (Edge-to-edge enforcement)
        EdgeToEdge.enable(this);
        
        super.onCreate(savedInstanceState);

        // Desabilita as barras de rolagem nativas do WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
        }
    }
}
