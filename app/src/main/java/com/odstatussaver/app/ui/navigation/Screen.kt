package com.odstatussaver.app.ui.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Settings : Screen("settings")
    object MediaViewer : Screen("viewer/{statusId}") {
        fun createRoute(statusId: String): String = "viewer/$statusId"
    }
}
