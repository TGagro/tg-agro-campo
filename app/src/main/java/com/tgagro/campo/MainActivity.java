package com.tgagro.campo;

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
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/index.html");
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
