# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Capacitor core + plugin discovery (reflection)
-keep public class * extends com.getcapacitor.Plugin
-keep public class com.getcapacitor.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}
-keep class com.getcapacitor.annotation.** { *; }

# WebView Javascript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# App custom native activities, compose screens and plugins
-keep class br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456.** { *; }

# Community & Capawesome plugins
-keep class com.getcapacitor.community.** { *; }
-keep class io.capawesome.** { *; }
-keep class com.aparajita.** { *; }
-keep class com.capgo.** { *; }

# Firebase Messaging + GMS
-keep class * extends com.google.firebase.messaging.FirebaseMessagingService { *; }
-keep,allowobfuscation,allowshrinking class com.google.firebase.iid.** { *; }
-keep,allowobfuscation,allowshrinking class com.google.android.gms.** { *; }
-keep,allowobfuscation,allowshrinking class com.google.firebase.** { *; }

# Symbolication attributes for Play Console / Crashlytics
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile

# Silence warnings from optional transitive deps
-dontwarn androidx.**
-dontwarn com.google.**
-dontwarn org.slf4j.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

