#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativePdfViewer, "NativePdfViewer",
    CAP_PLUGIN_METHOD(openPdf, CAPPluginReturnPromise);
)
