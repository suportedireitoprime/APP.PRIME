#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeHomePlugin, "NativeHome",
    CAP_PLUGIN_METHOD(showHome, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(hideHome, CAPPluginReturnPromise);
)
