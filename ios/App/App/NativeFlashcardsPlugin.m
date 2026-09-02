import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeFlashcardsPlugin, "NativeFlashcardsPlugin",
    CAP_PLUGIN_METHOD(openDashboard, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startStudySession, CAPPluginReturnPromise);
)
