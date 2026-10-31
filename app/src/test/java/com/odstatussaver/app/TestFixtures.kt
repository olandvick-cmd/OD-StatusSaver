package com.odstatussaver.app

import android.net.Uri
import io.mockk.mockk

/**
 * Shared test fixtures providing mocked Android framework types
 * that run reliably on host JVM unit tests without needing a physical device or emulator.
 */
object TestFixtures {
    fun createMockUri(): Uri = mockk(relaxed = true)
}
