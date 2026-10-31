package com.odstatussaver.app.data.preferences

import android.content.Context
import android.net.Uri
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.odstatussaver.app.domain.model.WhatsAppSource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "od_saf_preferences")

class SafPrefStore(private val context: Context) {

    private val keyWhatsappSafUri = stringPreferencesKey("saf_tree_uri_whatsapp")
    private val keyBusinessSafUri = stringPreferencesKey("saf_tree_uri_business")
    private val keyAnalyticsEnabled = booleanPreferencesKey("analytics_collection_enabled")
    private val keyNotificationPromptDismissed = booleanPreferencesKey("notification_prompt_dismissed")

    private fun getKeyForSource(source: WhatsAppSource): Preferences.Key<String> {
        return when (source) {
            WhatsAppSource.STANDARD -> keyWhatsappSafUri
            WhatsAppSource.BUSINESS -> keyBusinessSafUri
        }
    }

    fun getTreeUriFlow(source: WhatsAppSource): Flow<Uri?> {
        val key = getKeyForSource(source)
        return context.dataStore.data.map { preferences ->
            preferences[key]?.let { Uri.parse(it) }
        }
    }

    suspend fun getTreeUri(source: WhatsAppSource): Uri? {
        return getTreeUriFlow(source).first()
    }

    suspend fun saveTreeUri(source: WhatsAppSource, uri: Uri) {
        val key = getKeyForSource(source)
        context.dataStore.edit { preferences ->
            preferences[key] = uri.toString()
        }
    }

    suspend fun clearTreeUri(source: WhatsAppSource) {
        val key = getKeyForSource(source)
        context.dataStore.edit { preferences ->
            preferences.remove(key)
        }
    }

    suspend fun isNotificationPromptDismissed(): Boolean = context.dataStore.data.first()[keyNotificationPromptDismissed] ?: false

    suspend fun setNotificationPromptDismissed(dismissed: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[keyNotificationPromptDismissed] = dismissed
        }
    }

    // Analytics Collection Consent & User Control
    fun isAnalyticsEnabledFlow(): Flow<Boolean> {
        return context.dataStore.data.map { preferences ->
            preferences[keyAnalyticsEnabled] ?: true
        }
    }

    suspend fun isAnalyticsEnabled(): Boolean {
        return isAnalyticsEnabledFlow().first()
    }

    suspend fun setAnalyticsEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[keyAnalyticsEnabled] = enabled
        }
    }
}
