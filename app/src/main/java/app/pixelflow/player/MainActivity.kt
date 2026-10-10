package app.pixelflow.player

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private val bg = Color.rgb(15, 17, 22)
    private val panel = Color.rgb(26, 29, 37)
    private val accent = Color.rgb(150, 130, 255)
    private var selectedVideo: Uri? = null
    private lateinit var status: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = bg
        window.navigationBarColor = bg
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(22), dp(26), dp(22), dp(22))
            setBackgroundColor(bg)
        }
        root.addView(TextView(this).apply {
            text = "PixelFlow"
            textSize = 30f
            setTextColor(Color.WHITE)
            typeface = android.graphics.Typeface.create("sans-serif-medium", 0)
        })
        root.addView(TextView(this).apply {
            text = "YOUR MEDIA, YOUR FLOW"
            textSize = 11f
            letterSpacing = .16f
            setTextColor(Color.rgb(153, 157, 172))
            setPadding(0, dp(4), 0, dp(28))
        })
        root.addView(TextView(this).apply {
            text = "▶\n\nChoose a video to get started"
            gravity = Gravity.CENTER
            textSize = 17f
            setTextColor(Color.rgb(205, 207, 219))
            setBackgroundColor(panel)
        }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        status = TextView(this).apply {
            text = "Ready to open media"
            textSize = 13f
            setTextColor(Color.rgb(153, 157, 172))
            setPadding(0, dp(18), 0, dp(12))
        }
        root.addView(status)
        root.addView(Button(this).apply {
            text = "Open video"
            setTextColor(Color.WHITE)
            backgroundTintList = android.content.res.ColorStateList.valueOf(accent)
            setOnClickListener {
                startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "video/*"
                }, 101)
            }
        }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52)))
        root.addView(TextView(this).apply {
            text = "mpv playback engine integration is in progress"
            textSize = 11f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(120, 124, 139))
            setPadding(0, dp(14), 0, 0)
        })
        setContentView(root)
    }

    @Deprecated("Deprecated by Android, retained for compatibility")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 101 && resultCode == RESULT_OK) {
            selectedVideo = data?.data
            selectedVideo?.let {
                try { contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION) } catch (_: Exception) {}
                status.text = "Video selected"
            }
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
