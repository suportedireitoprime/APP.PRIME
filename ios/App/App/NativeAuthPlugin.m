#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeAuthPlugin, "NativeAuth",
    CAP_PLUGIN_METHOD(openAuth, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(openLanding, CAPPluginReturnPromise);
)
