#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeVideoaulasPlugin, "NativeVideoaulasPlugin",
    CAP_PLUGIN_METHOD(openHub, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(openVideo, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(closeVideo, CAPPluginReturnPromise);
)
