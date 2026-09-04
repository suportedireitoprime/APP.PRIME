#import <Capacitor/Capacitor.h>

CAP_PLUGIN(ResumosNativePlugin, "ResumosNativePlugin",
    CAP_PLUGIN_METHOD(openResumos, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(openReader, CAPPluginReturnPromise);
)
