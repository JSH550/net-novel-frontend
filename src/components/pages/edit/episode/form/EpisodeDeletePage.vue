<template>
    <article class="base-wrapper">
        <template v-if="episodeOrigin ?? false">
            <EpisodeEditForm
                @submit="deleteEpisode"
                :initial-input="episodeOrigin"
                :disabled="true"
            ></EpisodeEditForm>
        </template>
    </article>
</template>

<script setup>
import EpisodeEditForm from "./EpisodeEditForm.vue";

import { episodeApi } from "@/hooks/backendApi";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
    novelId: {
        type: Number,
        required: true,
    },
    episodeId: {
        type: Number,
        required: true,
    },
});

const router = useRouter();

//삭제할 에피소드 데이터 가져오기
const episodeOrigin = ref(undefined);

async function loadEpisodeData() {
    const data = await episodeApi.getEpisode(props.episodeId);
    return data;
}

onMounted(async () => {
    episodeOrigin.value = await loadEpisodeData();
});

//submit 클릭 이벤트
async function submit() {
    try {
        await deleteEpisode();
    } catch (error) {
        if (error.response.status === 500) {
            alert(
                "작품 삭제에 오류가 발생하였습니다. 현상이 지속된다면 고객센터로 문의 부탁드립니다."
            );
        }
    }
}

//에피소드 삭제
async function deleteEpisode() {
    await episodeApi.deleteEpisode(props.episodeId);
    router.push({ name: "episode-edit", params: { id: props.novelId } });
}
</script>

<style scoped lang="sass">
article
    margin-top: 30px
    margin-bottom: 30px
</style>
