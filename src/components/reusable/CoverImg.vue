<template>
    <div class="container">
        <img :src="cover" :alt="alt" />
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    imgUrl: String,
    alt: String,
});

const cover = computed(() => {
    if (props.imgUrl === undefined) {
        return "/cover/default.jpeg";
    }

    try {
        const s3Url = props.imgUrl.split("/").pop();
    } catch (error) {
        return "/cover/default.jpeg";
    }

    if (props.imgUrl.includes("null")) {
        return "/cover/default.jpeg";
    }
    return props.imgUrl;
});
</script>

<style scoped lang="sass">
.container
    background-color: var(--line-color)
    border-radius: 5px
    overflow: hidden
    cursor: pointer

    img
        width: 100%
        height: 100%
        object-fit: cover
        object-position: center
        transition: transform 0.6s ease // 부드러운 확대 효과를 위한 전환
        border: none

        &:hover
            transform: scale(1.1) // 마우스 오버 시 이미지 확대
</style>
