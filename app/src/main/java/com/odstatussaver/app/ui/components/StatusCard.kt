package com.odstatussaver.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.odstatussaver.app.domain.model.StatusItem

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun StatusCard(
    status: StatusItem,
    isSelected: Boolean,
    isSelectionMode: Boolean,
    onClick: () -> Unit,
    onLongClick: () -> Unit,
    onSaveClick: () -> Unit,
    onShareClick: () -> Unit,
    onDeleteClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth().aspectRatio(0.78f)
            .clip(RoundedCornerShape(18.dp))
            .border(
                width = if (isSelected) 2.dp else 0.dp,
                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent,
                shape = RoundedCornerShape(18.dp)
            )
            .combinedClickable(onClick = onClick, onLongClick = onLongClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Box(Modifier.fillMaxSize()) {
            AsyncImage(
                model = status.uri,
                contentDescription = status.title,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )

            if (isSelectionMode) {
                Surface(
                    modifier = Modifier.align(Alignment.TopEnd).padding(9.dp).size(26.dp),
                    shape = CircleShape,
                    color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Black.copy(alpha = 0.48f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        if (isSelected) Icon(Icons.Default.Check, contentDescription = "Selected", tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                }
            }

            Box(
                modifier = Modifier.fillMaxWidth().align(Alignment.BottomCenter)
                    .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.68f))))
                    .padding(horizontal = 8.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    if (status.isVideo) {
                        Surface(shape = CircleShape, color = Color.Black.copy(alpha = 0.48f)) {
                            Icon(Icons.Default.PlayArrow, contentDescription = "Video", tint = Color.White, modifier = Modifier.padding(5.dp).size(17.dp))
                        }
                    } else {
                        Box(Modifier.size(27.dp))
                    }

                    if (!isSelectionMode) {
                        IconButton(
                            onClick = onDeleteClick ?: onSaveClick,
                            enabled = onDeleteClick != null || !status.isSaved,
                            modifier = Modifier.size(34.dp).background(
                                if (status.isSaved && onDeleteClick == null) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.94f),
                                CircleShape
                            )
                        ) {
                            Icon(
                                imageVector = when {
                                    onDeleteClick != null -> Icons.Default.Delete
                                    status.isSaved -> Icons.Default.Check
                                    else -> Icons.Default.Download
                                },
                                contentDescription = when {
                                    onDeleteClick != null -> "Delete"
                                    status.isSaved -> "Saved"
                                    else -> "Save"
                                },
                                tint = if (status.isSaved && onDeleteClick == null) Color.White else Color(0xFF166534),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
