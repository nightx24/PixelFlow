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
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView

class MainActivity : Activity() {
    private val bg = Color.rgb(15, 17, 22)
    private val accent = Color.rgb(150, 130, 255)
    private var selectedVideo: Uri? = null
    private lateinit var status: TextView
    private lateinit var playerView: PlayerView
    private var player: ExoPlayer? = null

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
            setPadding(0, dp(4), 0, dp(20))
        })

        playerView = PlayerView(this).apply {
            setBackgroundColor(Color.BLACK)
            useController = true
            resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
            setShutterBackgroundColor(Color.BLACK)
            setKeepContentOnPlayerReset(true)
            setSurfaceType(PlayerView.SURFACE_TYPE_TEXTURE_VIEW)
        }
        root.addView(playerView, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
        ))

        status = TextView(this).apply {
            text = "Choose a video to start playback"
            textSize = 13f
            setTextColor(Color.rgb(153, 157, 172))
            setPadding(0, dp(16), 0, dp(12))
        }
        root.addView(status)
        root.addView(Button(this).apply {
            text = "Open video"
            setTextColor(Color.WHITE)
            backgroundTintList = android.content.res.ColorStateList.valueOf(accent)
            setOnClickListener { openVideoPicker() }
        }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52)))
        root.addView(TextView(this).apply {
            text = "Media3 playback · mpv integration is still in progress"
            textSize = 11f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(120, 124, 139))
            setPadding(0, dp(14), 0, 0)
        })
        setContentView(root)
    }

    private fun openVideoPicker() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "video/*"
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
        try {
            startActivityForResult(intent, 101)
        } catch (_: Exception) {
            startActivityForResult(Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "video/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            }, 101)
        }
    }

    private fun startPlayback(uri: Uri) {
        player?.release()
        status.text = "Loading video…"
        val newPlayer = ExoPlayer.Builder(this).build()
        player = newPlayer
        playerView.player = newPlayer
        newPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                status.text = when (playbackState) {
                    Player.STATE_BUFFERING -> "Loading video…"
                    Player.STATE_READY -> if (newPlayer.playWhenReady) "Playing video" else "Ready to play"
                    Player.STATE_ENDED -> "Playback finished"
                    else -> status.text
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                status.text = "Playback error: ${error.errorCodeName}"
            }
        })
        newPlayer.setMediaItem(MediaItem.fromUri(uri))
        newPlayer.prepare()
        newPlayer.playWhenReady = true
    }

    @Deprecated("Deprecated by Android, retained for compatibility")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != 101 || resultCode != RESULT_OK) return
        val uri = data?.data ?: return
        selectedVideo = uri
        try {
            contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        } catch (_: Exception) {
            // Some providers grant temporary read access only.
        }
        startPlayback(uri)
    }

    override fun onPause() {
        super.onPause()
        player?.pause()
    }

    override fun onDestroy() {
        playerView.player = null
        player?.release()
        player = null
        super.onDestroy()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
