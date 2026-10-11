package com.maicai.shop;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // targetSdk 35 在安卓 15+ 强制 edge-to-edge，adjustResize 失效，键盘会盖住网页。
        // 给 WebView 的父容器挂监听：键盘弹出时把 IME 高度设为 WebView 的 bottomMargin，
        // 页面视口随键盘真实缩小。
        // 只在安卓 15+ 启用：低版本 adjustResize 正常工作，窗口已在缩放，
        // margin 再叠加会在键盘动画期间造成双重缩放（界面上下抽动）。
        // 注意：监听必须挂在父容器并原样放行 insets——若挂在 WebView 上并 CONSUME，
        // Chromium 拿不到系统栏 insets，页面 env(safe-area-inset-*) 会全部归零，
        // 顶栏会与状态栏重叠、底栏会与全面屏手势条重叠。
        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            return;
        }
        View webView = bridge != null ? bridge.getWebView() : null;
        ViewGroup parent = webView != null && webView.getParent() instanceof ViewGroup
                ? (ViewGroup) webView.getParent() : null;
        if (parent == null) return;

        ViewCompat.setOnApplyWindowInsetsListener(parent, (v, windowInsets) -> {
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            ViewGroup.MarginLayoutParams lp =
                    (ViewGroup.MarginLayoutParams) webView.getLayoutParams();
            if (lp.bottomMargin != ime.bottom) {
                lp.bottomMargin = ime.bottom;
                webView.setLayoutParams(lp);
            }
            return windowInsets; // 不消费，继续传给 WebView，保住 safe-area env()
        });
    }
}
