package com.parlaxio.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onPause() {
        super.onPause();
        // Prevent WebView from pausing JS execution when app goes to background
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.resumeTimers();
            webView.onResume();
        }
    }
}
