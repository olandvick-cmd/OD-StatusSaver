package com.odstatussaver.app.domain.usecase

import android.net.Uri
import com.odstatussaver.app.domain.model.StatusItem
import com.odstatussaver.app.domain.model.WhatsAppSource
import com.odstatussaver.app.domain.repository.StatusRepository
import kotlinx.coroutines.flow.Flow

class GetStatusesUseCase(
    private val repository: StatusRepository
) {
    operator fun invoke(source: WhatsAppSource): Flow<List<StatusItem>> {
        return repository.getStatuses(source)
    }

    fun getSaved(): Flow<List<StatusItem>> {
        return repository.getSavedStatuses()
    }
}

class SaveStatusUseCase(
    private val repository: StatusRepository
) {
    suspend operator fun invoke(item: StatusItem): Result<Uri> {
        return repository.saveStatus(item)
    }
}
