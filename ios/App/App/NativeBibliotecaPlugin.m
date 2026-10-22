#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeBibliotecaPlugin, "NativeBibliotecaPlugin",
    CAP_PLUGIN_METHOD(openBiblioteca, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(closeBiblioteca, CAPPluginReturnPromise);
)
