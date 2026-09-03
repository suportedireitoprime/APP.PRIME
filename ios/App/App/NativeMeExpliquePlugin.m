#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeMeExpliquePlugin, "NativeMeExpliquePlugin",
    CAP_PLUGIN_METHOD(verificarPermissoes, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(alternarLanterna, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(vibrarFeedback, CAPPluginReturnPromise);
)
