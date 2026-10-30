package com.odstatussaver.app.domain.model

enum class WhatsAppSource(val displayName: String, val packageName: String) {
    STANDARD("WhatsApp", "com.whatsapp"),
    BUSINESS("WA Business", "com.whatsapp.w4b")
}
