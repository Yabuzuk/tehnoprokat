package io.github.yabuzuk.vodovozka;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Регистрируем плагин push-уведомлений
        registerPlugin(PushNotificationsPlugin.class);
    }
}
