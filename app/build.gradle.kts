plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "app.pixelflow.player"
    compileSdk = 35
    defaultConfig {
        applicationId = "app.pixelflow.player"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }
}
