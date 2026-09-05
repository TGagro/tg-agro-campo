package com.tgagro.campo;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.view.WindowInsets;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(
        android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
);

        webView = new WebView(this);

        android.widget.FrameLayout root = new android.widget.FrameLayout(this);

root.addView(
        webView,
        new android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT
        )
);
root.setOnApplyWindowInsetsListener((v, insets) -> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {

        android.graphics.Insets bars = insets.getInsets(
                WindowInsets.Type.systemBars()
        );

        android.graphics.Insets keyboard = insets.getInsets(
                WindowInsets.Type.ime()
        );

        int bottom = Math.max(bars.bottom, keyboard.bottom);

        v.setPadding(
                bars.left,
                bars.top,
                bars.right,
                bottom
        );

    } else {
        v.setPadding(
                insets.getSystemWindowInsetLeft(),
                insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(),
                insets.getSystemWindowInsetBottom()
        );
    }

    return insets;
});
setContentView(root);
root.requestApplyInsets();

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        // Necessário para o app local acessar a API HTTPS do Supabase.
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(
        new WebAppInterface(),
        "AndroidTG"
);
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/index.html");
    }

    private class WebAppInterface {

    @JavascriptInterface
    public void recuperarSenha(String email) {

        new Thread(() -> {

            HttpURLConnection conn = null;
            boolean sucesso = false;
            String resposta = "";

            try {

                URL url = new URL(
                        "https://olekhksinesqosfmtdjf.supabase.co/auth/v1/recover"
                );

                conn = (HttpURLConnection) url.openConnection();

                conn.setRequestMethod("POST");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);

                conn.setRequestProperty(
                        "apikey",
                        "sb_publishable_b_SgzfAoxE2Cs3KahdwLJw_hobIA1wd"
                );

                conn.setRequestProperty(
                        "Content-Type",
                        "application/json"
                );

                conn.setDoOutput(true);

                JSONObject body = new JSONObject();
                body.put("email", email);

                try (OutputStream os = conn.getOutputStream()) {

                    os.write(
                            body.toString()
                                    .getBytes("UTF-8")
                    );
                }

                int codigo =
                        conn.getResponseCode();

                sucesso =
                        codigo >= 200 &&
                        codigo < 300;

                InputStream stream =
                        sucesso
                                ? conn.getInputStream()
                                : conn.getErrorStream();

                if (stream != null) {

                    BufferedReader reader =
                            new BufferedReader(
                                    new InputStreamReader(stream)
                            );

                    StringBuilder texto =
                            new StringBuilder();

                    String linha;

                    while ((linha = reader.readLine()) != null) {
                        texto.append(linha);
                    }

                    reader.close();

                    resposta = texto.toString();
                }

                if (!sucesso && resposta.isEmpty()) {
                    resposta = "Erro HTTP " + codigo;
                }

            } catch (Exception e) {

                resposta =
                        e.getClass().getSimpleName() +
                        ": " +
                        e.getMessage();

            } finally {

                if (conn != null) {
                    conn.disconnect();
                }
            }

            final boolean ok = sucesso;
            final String resultado = resposta;

            webView.post(() -> {

                String js =
                        "window.onRecuperarSenhaResult(" +
                        ok +
                        "," +
                        JSONObject.quote(resultado) +
                        ");";

                webView.evaluateJavascript(
                        js,
                        null
                );
            });

        }).start();
    }
}

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
