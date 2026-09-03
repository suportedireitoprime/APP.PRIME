#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeQuestoesPlugin, "NativeQuestoesPlugin",
    CAP_PLUGIN_METHOD(openSession, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(closeSession, CAPPluginReturnPromise);
)
