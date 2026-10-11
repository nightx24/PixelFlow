plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "app.pixelflow.player"
    compileSdk = 35
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    defaultConfig {
        applicationId = "app.pixelflow.player"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "0.1.1"
    }

    // Optional stable signing for CI-generated test APKs. Configure GitHub Actions
    // secrets to enable it; without them, Android's normal debug key is used.
    val stableKeystore = System.getenv("PIXELFLOW_KEYSTORE_FILE")
    val stableKeyAlias = System.getenv("PIXELFLOW_KEY_ALIAS")
    val stableKeyPassword = System.getenv("PIXELFLOW_KEY_PASSWORD")
    val stableStorePassword = System.getenv("PIXELFLOW_STORE_PASSWORD")

    if (!stableKeystore.isNullOrBlank() &&
        !stableKeyAlias.isNullOrBlank() &&
        !stableKeyPassword.isNullOrBlank() &&
        !stableStorePassword.isNullOrBlank()
    ) {
        signingConfigs.create("stable") {
            storeFile = file(stableKeystore)
            keyAlias = stableKeyAlias
            keyPassword = stableKeyPassword
            storePassword = stableStorePassword
        }
        buildTypes.getByName("debug").signingConfig = signingConfigs.getByName("stable")
    }
}

dependencies {
    implementation("androidx.media3:media3-exoplayer:1.5.1")
    implementation("androidx.media3:media3-ui:1.5.1")
}
