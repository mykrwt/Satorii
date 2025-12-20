package com.satorii.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Satorii Forest Noir Palette
private val BgPrimary = Color(0xFF111410)
private val BgSecondary = Color(0xFF1A1D19)
private val BgTertiary = Color(0xFF232623)
private val BgElevated = Color(0xFF2F332F)

private val AccentPrimary = Color(0xFFDED1BD) // Cream/Gold
private val AccentSecondary = Color(0xFF556B5D) // Forest Green

private val TextPrimary = Color(0xFFDED1BD)
private val TextSecondary = Color(0xFF8C9690)
private val TextTertiary = Color(0xFF5C635E)

private val DarkColorScheme = darkColorScheme(
    primary = AccentPrimary,
    secondary = AccentSecondary,
    tertiary = BgElevated,
    background = BgPrimary,
    surface = BgSecondary,
    onPrimary = BgPrimary,
    onSecondary = Color.White,
    onTertiary = TextPrimary,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    surfaceVariant = BgTertiary,
    onSurfaceVariant = TextSecondary
)

@Composable
fun SatoriiTheme(
    darkTheme: Boolean = true, // Force Forest Noir theme
    dynamicColor: Boolean = false, // Disable dynamic color to maintain strict brand identity
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = BgPrimary.toArgb()
            window.navigationBarColor = BgPrimary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
