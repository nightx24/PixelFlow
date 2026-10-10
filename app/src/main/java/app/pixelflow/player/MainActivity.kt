package app.pixelflow.player

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.content.ContentUris
import android.database.Cursor
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import java.util.Locale

class MainActivity : Activity() {
    private val bg = Color.rgb(15, 17, 22)
    private val panel = Color.rgb(25, 28, 36)
    private val accent = Color.rgb(150, 130, 255)
    private val muted = Color.rgb(153, 157, 172)
    private lateinit var status: TextView
    private lateinit var libraryCount: TextView
    private lateinit var libraryList: LinearLayout
    private lateinit var playerView: PlayerView
    private var player: ExoPlayer? = null

    private data class VideoEntry(
        val uri: Uri,
        val name: String,
        val durationMs: Long,
        val sizeBytes: Long
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = bg
        window.navigationBarColor = bg

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(22), dp(18), dp(12))
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
            setTextColor(muted)
            setPadding(0, dp(3), 0, dp(14))
        })

        // Keep a compact player above the library so videos remain easy to browse.
        playerView = layoutInflater.inflate(R.layout.pixel_player_view, root, false) as PlayerView
        root.addView(playerView, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, dp(205)
        ))

        status = TextView(this).apply {
            text = "Choose a video to start playback"
            textSize = 12f
            setTextColor(muted)
            setPadding(0, dp(10), 0, dp(8))
        }
        root.addView(status)

        val actions = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
        }
        actions.addView(makeButton("Open video") { openVideoPicker() },
            LinearLayout.LayoutParams(0, dp(46), 1f))
        actions.addView(View(this), LinearLayout.LayoutParams(dp(10), 1))
        actions.addView(makeButton("Refresh") { loadLibrary() },
            LinearLayout.LayoutParams(0, dp(46), 1f))
        root.addView(actions)

        val libraryHeader = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(18), 0, dp(8))
        }
        libraryHeader.addView(TextView(this).apply {
            text = "Video library"
            textSize = 19f
            setTextColor(Color.WHITE)
            typeface = android.graphics.Typeface.create("sans-serif-medium", 0)
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        libraryCount = TextView(this).apply {
            text = "Scanning…"
            textSize = 12f
            setTextColor(muted)
        }
        libraryHeader.addView(libraryCount)
        root.addView(libraryHeader)

        val scroll = ScrollView(this).apply {
            isFillViewport = true
            clipToPadding = false
        }
        libraryList = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        scroll.addView(libraryList, ScrollView.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ))
        root.addView(scroll, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
        ))

        root.addView(TextView(this).apply {
            text = "Media3 playback · mpv integration is still in progress"
            textSize = 10f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(120, 124, 139))
            setPadding(0, dp(10), 0, 0)
        })
        setContentView(root)

        if (hasVideoPermission()) {
            loadLibrary()
        } else {
            requestVideoPermission()
        }
    }

    private fun makeButton(label: String, action: () -> Unit): Button =
        Button(this).apply {
            text = label
            textSize = 13f
            isAllCaps = false
            setTextColor(Color.WHITE)
            backgroundTintList = android.content.res.ColorStateList.valueOf(accent)
            setOnClickListener { action() }
        }

    private fun hasVideoPermission(): Boolean {
        val permission = if (Build.VERSION.SDK_INT >= 33) {
            Manifest.permission.READ_MEDIA_VIDEO
        } else {
            Manifest.permission.READ_EXTERNAL_STORAGE
        }
        return checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestVideoPermission() {
        val permission = if (Build.VERSION.SDK_INT >= 33) {
            Manifest.permission.READ_MEDIA_VIDEO
        } else {
            Manifest.permission.READ_EXTERNAL_STORAGE
        }
        requestPermissions(arrayOf(permission), 202)
    }

    @Deprecated("Deprecated by Android, retained for compatibility")
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != 202) return
        if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            loadLibrary()
        } else {
            libraryCount.text = "Permission needed"
            showLibraryMessage("Allow video access to browse videos stored on your device.")
        }
    }

    private fun loadLibrary() {
        if (!hasVideoPermission()) {
            requestVideoPermission()
            return
        }
        libraryCount.text = "Scanning…"
        libraryList.removeAllViews()
        val videos = mutableListOf<VideoEntry>()
        val collection = MediaStore.Video.Media.EXTERNAL_CONTENT_URI
        val projection = arrayOf(
            MediaStore.Video.Media._ID,
            MediaStore.Video.Media.DISPLAY_NAME,
            MediaStore.Video.Media.DURATION,
            MediaStore.Video.Media.SIZE
        )
        val sortOrder = "${MediaStore.Video.Media.DATE_ADDED} DESC"
        try {
            contentResolver.query(collection, projection, null, null, sortOrder)?.use { cursor ->
                val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID)
                val nameColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME)
                val durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DURATION)
                val sizeColumn = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE)
                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idColumn)
                    videos.add(VideoEntry(
                        ContentUris.withAppendedId(collection, id),
                        cursor.getString(nameColumn) ?: "Untitled video",
                        cursor.getLong(durationColumn),
                        cursor.getLong(sizeColumn)
                    ))
                }
            }
        } catch (_: Exception) {
            libraryCount.text = "Unable to scan"
            showLibraryMessage("Could not read the device video library. Tap Refresh to try again.")
            return
        }

        libraryCount.text = "${videos.size} video" + if (videos.size == 1) "" else "s"
        if (videos.isEmpty()) {
            showLibraryMessage("No videos found on this device. Use Open video to choose one from Files.")
            return
        }
        videos.forEach { video -> addVideoRow(video) }
    }

    private fun addVideoRow(video: VideoEntry) {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(14), dp(12), dp(14), dp(12))
            setBackgroundColor(panel)
            isClickable = true
            isFocusable = true
            setOnClickListener { startPlayback(video.uri, video.name) }
        }
        row.addView(TextView(this).apply {
            text = video.name
            textSize = 14f
            maxLines = 2
            setTextColor(Color.WHITE)
            typeface = android.graphics.Typeface.create("sans-serif-medium", 0)
        })
        row.addView(TextView(this).apply {
            text = "${formatDuration(video.durationMs)}  ·  ${formatSize(video.sizeBytes)}"
            textSize = 11f
            setTextColor(muted)
            setPadding(0, dp(5), 0, 0)
        })
        libraryList.addView(row, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = dp(8) })
    }

    private fun showLibraryMessage(message: String) {
        libraryList.removeAllViews()
        libraryList.addView(TextView(this).apply {
            text = message
            textSize = 13f
            setTextColor(muted)
            setPadding(dp(4), dp(14), dp(4), dp(18))
        })
    }

    private fun formatDuration(ms: Long): String {
        val totalSeconds = (ms / 1000).coerceAtLeast(0)
        val hours = totalSeconds / 3600
        val minutes = (totalSeconds % 3600) / 60
        val seconds = totalSeconds % 60
        return if (hours > 0) String.format(Locale.getDefault(), "%d:%02d:%02d", hours, minutes, seconds)
        else String.format(Locale.getDefault(), "%d:%02d", minutes, seconds)
    }

    private fun formatSize(bytes: Long): String {
        if (bytes < 1024L * 1024L) return "${(bytes / 1024L).coerceAtLeast(1)} KB"
        return String.format(Locale.getDefault(), "%.1f MB", bytes / (1024.0 * 1024.0))
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

    private fun startPlayback(uri: Uri, name: String? = null) {
        player?.release()
        status.text = "Loading video…"
        val newPlayer = ExoPlayer.Builder(this).build()
        player = newPlayer
        playerView.player = newPlayer
        newPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                status.text = when (playbackState) {
                    Player.STATE_BUFFERING -> "Loading video…"
                    Player.STATE_READY -> if (newPlayer.playWhenReady) "Playing: ${name ?: "selected video"}" else "Ready to play"
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
