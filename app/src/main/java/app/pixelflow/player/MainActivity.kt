package app.pixelflow.player

import android.Manifest
import android.app.Activity
import android.content.ContentUris
import android.content.Intent
import android.content.pm.PackageManager
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
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
    private val bg = Color.rgb(16, 17, 20)
    private val surface = Color.rgb(29, 30, 35)
    private val surfaceAlt = Color.rgb(38, 39, 45)
    private val accent = Color.rgb(196, 181, 253)
    private val accentInk = Color.rgb(36, 25, 72)
    private val textPrimary = Color.rgb(245, 244, 250)
    private val muted = Color.rgb(166, 166, 178)

    private lateinit var status: TextView
    private lateinit var libraryCount: TextView
    private lateinit var libraryList: LinearLayout
    private lateinit var playerView: PlayerView
    private lateinit var searchInput: EditText
    private lateinit var videosTab: TextView
    private lateinit var foldersTab: TextView
    private lateinit var folderBack: TextView
    private var player: ExoPlayer? = null
    private var allVideos: List<VideoEntry> = emptyList()
    private var activeTab = "folders"
    private var gridMode = false
    private var searchVisible = false
    private var selectedFolder: String? = null
    private var searchQuery = ""

    private data class VideoEntry(
        val uri: Uri,
        val id: Long,
        val name: String,
        val durationMs: Long,
        val sizeBytes: Long,
        val folder: String
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = bg
        window.navigationBarColor = bg
        window.decorView.systemUiVisibility = 0

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(18), dp(20), dp(8))
            setBackgroundColor(bg)
        }

        val toolbar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        val brand = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        brand.addView(TextView(this).apply {
            text = "PixelFlow"
            textSize = 27f
            setTextColor(textPrimary)
            typeface = android.graphics.Typeface.create("sans-serif-medium", 0)
            letterSpacing = -.025f
        })
        brand.addView(TextView(this).apply {
            text = "YOUR VIDEO SPACE"
            textSize = 10f
            letterSpacing = .16f
            setTextColor(muted)
            setPadding(1, dp(1), 0, 0)
        })
        toolbar.addView(brand, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        toolbar.addView(makeActionButton("⌕", "Search videos") {
            searchVisible = !searchVisible
            searchInput.visibility = if (searchVisible) View.VISIBLE else View.GONE
            if (searchVisible) searchInput.requestFocus() else {
                searchInput.setText("")
                val imm = getSystemService(INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
                imm.hideSoftInputFromWindow(searchInput.windowToken, 0)
            }
        }, LinearLayout.LayoutParams(dp(42), dp(46)))
        toolbar.addView(makeActionButton("▦", "Quick settings") { showQuickSettings() },
            LinearLayout.LayoutParams(dp(42), dp(46)))
        toolbar.addView(makeActionButton("⚙", "Settings") { showSettings() },
            LinearLayout.LayoutParams(dp(42), dp(46)))
        root.addView(toolbar)

        searchInput = EditText(this).apply {
            hint = "Search videos and folders"
            textSize = 14f
            isSingleLine = true
            setTextColor(textPrimary)
            setHintTextColor(muted)
            setPadding(dp(15), 0, dp(12), 0)
            background = roundedBackground(surface, dp(16))
            compoundDrawablePadding = dp(8)
        }
        val searchParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50))
        searchParams.topMargin = dp(20)
        searchInput.visibility = View.GONE
        root.addView(searchInput, searchParams)

        val tabs = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(14), 0, dp(10))
        }
        videosTab = makeTab("Videos") { activeTab = "videos"; selectedFolder = null; renderLibrary() }
        foldersTab = makeTab("Folders") { activeTab = "folders"; selectedFolder = null; renderLibrary() }
        tabs.addView(videosTab, LinearLayout.LayoutParams(0, dp(40), 1f).apply { marginEnd = dp(8) })
        tabs.addView(foldersTab, LinearLayout.LayoutParams(0, dp(40), 1f))
        root.addView(tabs)

        folderBack = TextView(this).apply {
            text = "‹   All folders"
            textSize = 13f
            setTextColor(accent)
            setPadding(0, dp(4), 0, dp(8))
            visibility = View.GONE
            setOnClickListener { selectedFolder = null; activeTab = "folders"; renderLibrary() }
        }
        root.addView(folderBack)

        playerView = layoutInflater.inflate(R.layout.pixel_player_view, root, false) as PlayerView
        playerView.visibility = View.GONE
        val playerParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(210))
        playerParams.bottomMargin = dp(12)
        root.addView(playerView, playerParams)

        val listHeader = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(6), 0, dp(10))
        }
        listHeader.addView(TextView(this).apply {
            text = "Your library"
            textSize = 19f
            setTextColor(textPrimary)
            typeface = android.graphics.Typeface.create("sans-serif-medium", 0)
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        libraryCount = TextView(this).apply {
            text = "Scanning…"
            textSize = 12f
            setTextColor(muted)
        }
        listHeader.addView(libraryCount)
        root.addView(listHeader)

        val scroll = ScrollView(this).apply {
            isFillViewport = true
            clipToPadding = false
            setVerticalScrollBarEnabled(false)
        }
        libraryList = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        scroll.addView(libraryList, ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ))
        root.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        status = TextView(this).apply {
            text = "Choose a video to start playback"
            textSize = 11f
            gravity = Gravity.CENTER
            setTextColor(muted)
            setPadding(0, dp(10), 0, dp(5))
        }
        root.addView(status)
        setContentView(root)

        searchInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                searchQuery = s?.toString()?.trim().orEmpty()
                renderLibrary()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        if (hasVideoPermission()) loadLibrary() else requestVideoPermission()
    }

    private fun makeTab(label: String, action: () -> Unit): TextView =
        TextView(this).apply {
            text = label
            textSize = 14f
            gravity = Gravity.CENTER
            setTextColor(textPrimary)
            typeface = android.graphics.Typeface.create("sans-serif-medium", 0)
            setOnClickListener { action() }
        }

    private fun makeActionButton(label: String, description: String, action: () -> Unit): TextView =
        TextView(this).apply {
            text = label
            contentDescription = description
            textSize = 26f
            gravity = Gravity.CENTER
            setTextColor(accentInk)
            background = roundedBackground(accent, dp(16))
            setOnClickListener { action() }
        }

    private fun roundedBackground(color: Int, radius: Int): android.graphics.drawable.GradientDrawable =
        android.graphics.drawable.GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius.toFloat()
        }

    private fun hasVideoPermission(): Boolean {
        val permission = if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_VIDEO
        else Manifest.permission.READ_EXTERNAL_STORAGE
        return checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestVideoPermission() {
        val permission = if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_VIDEO
        else Manifest.permission.READ_EXTERNAL_STORAGE
        requestPermissions(arrayOf(permission), 202)
    }

    @Deprecated("Deprecated by Android, retained for compatibility")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != 202) return
        if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) loadLibrary()
        else {
            libraryCount.text = "Permission needed"
            showLibraryMessage("Allow video access to browse videos on your device.")
        }
    }

    private fun loadLibrary() {
        if (!hasVideoPermission()) { requestVideoPermission(); return }
        libraryCount.text = "Scanning…"
        val videos = mutableListOf<VideoEntry>()
        val collection = MediaStore.Video.Media.EXTERNAL_CONTENT_URI
        val projection = arrayOf(
            MediaStore.Video.Media._ID,
            MediaStore.Video.Media.DISPLAY_NAME,
            MediaStore.Video.Media.DURATION,
            MediaStore.Video.Media.SIZE,
            MediaStore.Video.Media.BUCKET_DISPLAY_NAME
        )
        try {
            contentResolver.query(collection, projection, null, null, "${MediaStore.Video.Media.DATE_ADDED} DESC")?.use { cursor ->
                val idCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID)
                val nameCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME)
                val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DURATION)
                val sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE)
                val folderCol = cursor.getColumnIndex(MediaStore.Video.Media.BUCKET_DISPLAY_NAME)
                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idCol)
                    videos.add(VideoEntry(
                        ContentUris.withAppendedId(collection, id),
                        id,
                        cursor.getString(nameCol) ?: "Untitled video",
                        cursor.getLong(durationCol),
                        cursor.getLong(sizeCol),
                        if (folderCol >= 0) cursor.getString(folderCol) ?: "Other" else "Other"
                    ))
                }
            }
        } catch (_: Exception) {
            libraryCount.text = "Unable to scan"
            showLibraryMessage("Could not read the video library. Tap Refresh to try again.")
            return
        }
        allVideos = videos
        renderLibrary()
    }

    private fun showSettings() {
        val options = arrayOf(
            "Appearance\\nAdjust the app to your liking",
            "Media library\\nScan and manage media library",
            "Player\\nPlayer appearance, playback controls",
            "Gestures\\nConfigure player touch gestures",
            "Audio\\nAudio playback options",
            "Subtitle\\nSubtitle appearance, playback options",
            "General\\nUser data options",
            "About\\nVersion, support, credits"
        )
        android.app.AlertDialog.Builder(this)
            .setTitle("Settings")
            .setItems(options) { _, which ->
                if (which == 1) loadLibrary()
                else android.app.AlertDialog.Builder(this)
                    .setTitle(options[which].substringBefore("\\n"))
                    .setMessage(when (which) {
                        0 -> "PixelFlow uses a dark theme with a lavender accent."
                        2 -> "Playback controls are available on the video player."
                        3 -> "Touch gestures can be configured in a future update."
                        4 -> "Audio track selection is planned for a future update."
                        5 -> "Subtitle controls are planned for a future update."
                        6 -> "Your media stays on your device."
                        else -> "PixelFlow video player"
                    })
                    .setPositiveButton("OK", null).show()
            }.setNegativeButton("Close", null).show()
    }

    private fun showQuickSettings() {
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(8), dp(20), dp(4))
        }
        fun addChoice(title: String, choices: List<String>, selected: String, onChoose: (String) -> Unit) {
            content.addView(TextView(this).apply {
                text = title
                textSize = 14f
                setTextColor(muted)
                setPadding(0, dp(10), 0, dp(8))
            })
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            choices.forEach { choice ->
                val chip = TextView(this).apply {
                    text = choice
                    gravity = Gravity.CENTER
                    textSize = 12f
                    setTextColor(if (choice == selected) accentInk else textPrimary)
                    background = roundedBackground(if (choice == selected) accent else surfaceAlt, dp(12))
                    setPadding(dp(10), dp(10), dp(10), dp(10))
                    setOnClickListener { onChoose(choice) }
                }
                row.addView(chip, LinearLayout.LayoutParams(0, dp(42), 1f).apply { marginEnd = dp(5) })
            }
            content.addView(row)
        }
        addChoice("Media view mode", listOf("Tree", "Folders", "Videos"), if (activeTab == "folders") "Folders" else "Videos") {
            activeTab = if (it == "Videos") "videos" else "folders"
            selectedFolder = null
            renderLibrary()
            showQuickSettings()
        }
        addChoice("Media layout", listOf("List", "Grid"), if (gridMode) "Grid" else "List") {
            gridMode = it == "Grid"
            android.app.AlertDialog.Builder(this).setTitle("Quick Settings").setView(content)
                .setPositiveButton("Done", null).show()
        }
        android.app.AlertDialog.Builder(this).setTitle("Quick Settings").setView(content)
            .setPositiveButton("Done", null).setNegativeButton("Cancel", null).show()
    }

    private fun renderLibrary() {
        if (!::libraryList.isInitialized) return
        libraryList.removeAllViews()
        videosTab.setBackground(if (activeTab == "videos") roundedBackground(surfaceAlt, dp(14)) else roundedBackground(bg, dp(14)))
        foldersTab.setBackground(if (activeTab == "folders") roundedBackground(surfaceAlt, dp(14)) else roundedBackground(bg, dp(14)))
        videosTab.setTextColor(if (activeTab == "videos") accent else muted)
        foldersTab.setTextColor(if (activeTab == "folders") accent else muted)
        folderBack.visibility = if (selectedFolder != null) View.VISIBLE else View.GONE

        val filtered = allVideos.filter {
            (selectedFolder == null || it.folder == selectedFolder) &&
                (searchQuery.isBlank() || it.name.contains(searchQuery, true) || it.folder.contains(searchQuery, true))
        }
        libraryCount.text = if (activeTab == "folders" && selectedFolder == null) {
            "${filtered.map { it.folder }.distinct().size} folders"
        } else "${filtered.size} videos"

        if (allVideos.isEmpty()) {
            showLibraryMessage("No videos found yet. Add a video to your device or tap + to open one from Files.")
            return
        }
        if (activeTab == "folders" && selectedFolder == null) {
            val groups = filtered.groupBy { it.folder }.toSortedMap(String.CASE_INSENSITIVE_ORDER)
            if (groups.isEmpty()) { showLibraryMessage("No matching folders."); return }
            groups.forEach { (folder, entries) -> addFolderRow(folder, entries.size) }
        } else {
            if (filtered.isEmpty()) { showLibraryMessage("No matching videos. Try another search."); return }
            filtered.forEach { addVideoRow(it) }
        }
    }

    private fun addFolderRow(folder: String, count: Int) {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(15), dp(15), dp(14), dp(15))
            background = roundedBackground(surface, dp(17))
            isClickable = true
            isFocusable = true
            setOnClickListener {
                selectedFolder = folder
                activeTab = "videos"
                renderLibrary()
            }
        }
        row.addView(TextView(this).apply {
            text = "▰"
            textSize = 24f
            gravity = Gravity.CENTER
            setTextColor(accent)
            background = roundedBackground(surfaceAlt, dp(13))
        }, LinearLayout.LayoutParams(dp(52), dp(52)))
        val info = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(13), 0, 0, 0)
            addView(TextView(this@MainActivity).apply {
                text = folder
                textSize = 15f
                maxLines = 1
                ellipsize = android.text.TextUtils.TruncateAt.END
                setTextColor(textPrimary)
                typeface = android.graphics.Typeface.create("sans-serif-medium", 0)
            })
            addView(TextView(this@MainActivity).apply {
                text = "$count videos"
                textSize = 12f
                setTextColor(muted)
                setPadding(0, dp(4), 0, 0)
            })
        }
        row.addView(info, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        row.addView(TextView(this).apply { text = "›"; textSize = 28f; setTextColor(muted) })
        libraryList.addView(row, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = dp(9)
        })
    }

    private fun addVideoRow(video: VideoEntry) {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(10), dp(10), dp(12), dp(10))
            background = roundedBackground(surface, dp(17))
            isClickable = true
            isFocusable = true
            setOnClickListener { startPlayback(video.uri, video.name) }
        }
        val thumbnail = ImageView(this).apply {
            scaleType = ImageView.ScaleType.CENTER_CROP
            background = roundedBackground(surfaceAlt, dp(12))
            setImageDrawable(null)
            try {
                val bitmap: Bitmap? = if (Build.VERSION.SDK_INT >= 29) {
                    contentResolver.loadThumbnail(video.uri, android.util.Size(dp(104), dp(72)), null)
                } else {
                    @Suppress("DEPRECATION")
                    MediaStore.Video.Thumbnails.getThumbnail(contentResolver, video.id, MediaStore.Video.Thumbnails.MINI_KIND, null)
                }
                if (bitmap != null) setImageBitmap(bitmap) else setImageResource(android.R.drawable.ic_media_play)
            } catch (_: Exception) {
                setImageResource(android.R.drawable.ic_media_play)
            }
        }
        row.addView(thumbnail, LinearLayout.LayoutParams(dp(104), dp(72)))
        val info = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), 0, dp(4), 0)
        }
        info.addView(TextView(this).apply {
            text = video.name
            textSize = 14f
            maxLines = 2
            ellipsize = android.text.TextUtils.TruncateAt.END
            setTextColor(textPrimary)
            typeface = android.graphics.Typeface.create("sans-serif-medium", 0)
        })
        info.addView(TextView(this).apply {
            text = "${formatDuration(video.durationMs)}  ·  ${formatSize(video.sizeBytes)}"
            textSize = 11f
            setTextColor(muted)
            setPadding(0, dp(5), 0, 0)
        })
        info.addView(TextView(this).apply {
            text = video.folder
            textSize = 10f
            maxLines = 1
            setTextColor(muted)
            setPadding(0, dp(4), 0, 0)
        })
        row.addView(info, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        libraryList.addView(row, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = dp(9)
        })
    }

    private fun showLibraryMessage(message: String) {
        libraryList.removeAllViews()
        libraryList.addView(TextView(this).apply {
            text = message
            textSize = 13f
            setTextColor(muted)
            setPadding(dp(4), dp(18), dp(4), dp(20))
        })
    }

    private fun formatDuration(ms: Long): String {
        val seconds = (ms / 1000).coerceAtLeast(0)
        val h = seconds / 3600
        val m = (seconds % 3600) / 60
        val s = seconds % 60
        return if (h > 0) String.format(Locale.getDefault(), "%d:%02d:%02d", h, m, s)
        else String.format(Locale.getDefault(), "%d:%02d", m, s)
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
        try { startActivityForResult(intent, 101) }
        catch (_: Exception) {
            startActivityForResult(Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "video/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            }, 101)
        }
    }

    private fun startPlayback(uri: Uri, name: String? = null) {
        player?.release()
        playerView.visibility = View.VISIBLE
        status.text = "Loading video…"
        val newPlayer = ExoPlayer.Builder(this).build()
        player = newPlayer
        playerView.player = newPlayer
        newPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                status.text = when (playbackState) {
                    Player.STATE_BUFFERING -> "Loading video…"
                    Player.STATE_READY -> if (newPlayer.playWhenReady) "Now playing · ${name ?: "selected video"}" else "Ready to play"
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
        try { contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
        catch (_: Exception) { }
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
