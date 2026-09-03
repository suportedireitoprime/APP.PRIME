#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeFlashcardsPlugin, "NativeFlashcardsPlugin",
    CAP_PLUGIN_METHOD(openSession, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(closeSession, CAPPluginReturnPromise);
)
