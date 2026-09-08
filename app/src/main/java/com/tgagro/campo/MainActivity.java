package com.tgagro.campo;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;
import android.Manifest;
import android.content.pm.PackageManager;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Looper;
import android.content.Intent;
import android.net.Uri;
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
        s.setGeolocationEnabled(true);
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
       
        if (
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
    checkSelfPermission(
        Manifest.permission.ACCESS_FINE_LOCATION
    ) != PackageManager.PERMISSION_GRANTED &&
    checkSelfPermission(
        Manifest.permission.ACCESS_COARSE_LOCATION
    ) != PackageManager.PERMISSION_GRANTED
) {

    requestPermissions(
        new String[]{
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        },
        1001
    );
}
        webView.loadUrl("file:///android_asset/index.html");
    }

    private class WebAppInterface {
        

        @JavascriptInterface
public void capturarLocalizacao() {

    runOnUiThread(() -> {

        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            checkSelfPermission(
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED &&
            checkSelfPermission(
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {

            requestPermissions(
                new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                },
                1001
            );

            enviarLocalizacaoJS(
                false,
                0,
                0,
                "Autorize a localização e tente novamente"
            );

            return;
        }

        try {

            LocationManager lm =
                (LocationManager) getSystemService(
                    Context.LOCATION_SERVICE
                );

            Location melhor = null;

            if (
                lm.isProviderEnabled(
                    LocationManager.GPS_PROVIDER
                )
            ) {
                melhor =
                    lm.getLastKnownLocation(
                        LocationManager.GPS_PROVIDER
                    );
            }

            if (
                melhor == null &&
                lm.isProviderEnabled(
                    LocationManager.NETWORK_PROVIDER
                )
            ) {
                melhor =
                    lm.getLastKnownLocation(
                        LocationManager.NETWORK_PROVIDER
                    );
            }

            if (melhor != null) {

                enviarLocalizacaoJS(
                    true,
                    melhor.getLatitude(),
                    melhor.getLongitude(),
                    "Localização obtida"
                );

                return;
            }

            LocationListener listener =
                new LocationListener() {

                    @Override
                    public void onLocationChanged(
                        Location location
                    ) {

                        lm.removeUpdates(this);

                        enviarLocalizacaoJS(
                            true,
                            location.getLatitude(),
                            location.getLongitude(),
                            "Localização obtida"
                        );
                    }

                    @Override
                    public void onProviderEnabled(
                        String provider
                    ) {}

                    @Override
                    public void onProviderDisabled(
                        String provider
                    ) {}

                    @Override
                    public void onStatusChanged(
                        String provider,
                        int status,
                        Bundle extras
                    ) {}
                };

            if (
                lm.isProviderEnabled(
                    LocationManager.GPS_PROVIDER
                )
            ) {

                lm.requestSingleUpdate(
                    LocationManager.GPS_PROVIDER,
                    listener,
                    Looper.getMainLooper()
                );

            } else if (
                lm.isProviderEnabled(
                    LocationManager.NETWORK_PROVIDER
                )
            ) {

                lm.requestSingleUpdate(
                    LocationManager.NETWORK_PROVIDER,
                    listener,
                    Looper.getMainLooper()
                );

            } else {

                enviarLocalizacaoJS(
                    false,
                    0,
                    0,
                    "Ative a localização do aparelho"
                );
            }

        } catch (Exception e) {

            enviarLocalizacaoJS(
                false,
                0,
                0,
                e.getMessage()
            );
        }
    });
}
        @JavascriptInterface
public void abrirMapa(double latitude, double longitude) {

    runOnUiThread(() -> {

        try {

            Uri uri = Uri.parse(
                "geo:" +
                latitude + "," + longitude +
                "?q=" +
                latitude + "," + longitude
            );

            Intent intent =
                new Intent(
                    Intent.ACTION_VIEW,
                    uri
                );

            startActivity(intent);

        } catch (Exception e) {

            try {

                Uri uriWeb = Uri.parse(
                    "https://www.google.com/maps/search/?api=1&query=" +
                    latitude + "," + longitude
                );

                Intent navegador =
                    new Intent(
                        Intent.ACTION_VIEW,
                        uriWeb
                    );

                startActivity(navegador);

            } catch (Exception ex) {

                Toast.makeText(
                    MainActivity.this,
                    "Não foi possível abrir o mapa",
                    Toast.LENGTH_SHORT
                ).show();
            }
        }
    });
}

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

    private void enviarLocalizacaoJS(
        boolean ok,
        double latitude,
        double longitude,
        String mensagem
) {

    webView.post(() -> {

        String js =
            "window.onLocalizacaoTG(" +
            ok + "," +
            latitude + "," +
            longitude + "," +
            JSONObject.quote(mensagem) +
            ");";

        webView.evaluateJavascript(
            js,
            null
        );
    });
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
