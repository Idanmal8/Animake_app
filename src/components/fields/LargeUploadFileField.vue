<script setup lang="ts">
import vhsIcon from '@/assets/icons/vhs.png'
import { useVideoUploadStore } from '@/stores/video_upload/video_upload'
import { ref } from 'vue'

const store = useVideoUploadStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    store.uploadVideo(input.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (file.type.startsWith('video/')) {
        store.uploadVideo(file)
    }
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}
</script>

<template>
    <div 
        class="large-upload-file-field"
        :class="{ 'is-dragging': isDragging }"
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
    >
        <input 
            ref="fileInput"
            type="file"
            accept="video/*"
            class="hidden-input"
            @change="handleFileSelect"
        />
        <img class="large-upload-file-field__icon" :src="vhsIcon" alt="">
        <p class="large-upload-file-field__title">Upload your video</p>
        <p class="large-upload-file-field__description">Drag and drop or click to upload</p>
        <p class="large-upload-file-field__disclaimer">Accepted formats: MP4, AVI, MOV, WMV, MKV</p>
    </div>
</template>

<style lang="scss" scoped>
.large-upload-file-field {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    max-width: 800px;
    padding: 5rem 15rem;
    border: 2px solid hsl(var(--border));
    border-radius: 12px;
    background-color: hsl(var(--card) / 0.5);
    transition: all 0.3s ease;
    cursor: pointer;    
    margin: 2rem auto;

    &.is-dragging {
        border-color: hsl(var(--primary));
        background-color: hsl(var(--accent) / 0.2);
        transform: scale(1.01);
    }

    /* Add hover effect for interaction */
    &:hover {
        border-color: hsl(var(--primary));
        background-color: hsl(var(--accent) / 0.1);
    }

    .hidden-input {
        display: none;
    }

    &__icon {
        width: 4rem;
        height: 4rem;
        object-fit: contain;
        opacity: 0.8;
        margin-bottom: 0.5rem;
    }

    &__title {
        font-size: 1.5rem;
        font-weight: 600;
        color: hsl(var(--foreground));
    }

    &__description {
        font-size: 1rem;
        color: hsl(var(--muted-foreground));
    }

    &__disclaimer {
        font-size: 0.875rem;
        color: hsl(var(--muted-foreground) / 0.7);
    }

    @media (max-width: 1200px) {
        padding: 3rem 10rem;
    }

    @media (max-width: 768px) {
        padding: 2rem 5rem;
    }
}
</style>