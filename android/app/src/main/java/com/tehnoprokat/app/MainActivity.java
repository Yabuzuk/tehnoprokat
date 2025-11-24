package com.tehnoprokat.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Регистрируем плагины уведомлений
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(LocalNotificationsPlugin.class);
    }
}
