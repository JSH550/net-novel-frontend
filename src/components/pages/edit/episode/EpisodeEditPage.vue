<template>
    <main>
        <section class="novel-info base-wrapper">
            <h3 v-once>작품 에피소드 편집</h3>
            <ListItem
                v-if="novelInfo ?? false"
                :id="novelInfo.id"
                :cover-img="novelInfo.thumbnailUrl"
                :custom="true"
            >
                <div class="stats">
                    <h3>{{ novelInfo.title }}</h3>
                    <p>전체 화수 {{ novelInfo.episodeCount }}화</p>
                    <p>조회수: {{ novelInfo.views }}</p>
                    <p>평점 평균: {{ novelInfo.averageRating }}</p>
                    <p>선호작: {{ novelInfo.favoriteCount }}</p>
                </div>
            </ListItem>
        </section>
        <section class="episode-list base-wrapper">
            <table class="hover striped">
                <colgroup>
                    <col style="width: 80px" />
                    <col style="width: 360px" />
                    <col style="width: 120px" />
                    <col style="width: 80px" />
                    <col style="width: 80px" />
                    <col style="width: 80px" />
                </colgroup>
                <thead>
                    <tr class="header">
                        <th scope="col">회차</th>
                        <th scope="col">에피소드 제목</th>
                        <th scope="col">게시 일자</th>
                        <th scope="col" colspan="3">상세 정보</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th colspan="7">
                            <button class="button" @click="goToCreate">새 에피소드 작성</button>
                        </th>
                    </tr>
                    <tr>
                        <th colspan="7">
                            <button class="button contrast" @click="goToDelete">
                                최신 에피소드 삭제
                            </button>
                        </th>
                    </tr>
                    <InfiniteScroll v-bind="scrollProps" ref="scrollRef">
                        <template v-slot:default="{ item }">
                            <EpisodeEditListItem
                                :novelId="novelId"
                                :episode="item"
                            ></EpisodeEditListItem>
                        </template>
                    </InfiniteScroll>
                </tbody>
            </table>
        </section>
    </main>
</template>

<script setup>
import InfiniteScroll from "@/components/reusable/InfiniteScroll.vue";
import EpisodeEditListItem from "./EpisodeEditListItem.vue";
import ListItem from "@/components/reusable/novel/ListItem.vue";

import { onMounted, reactive, ref } from "vue";
import { episodeApi, novelApi } from "@/hooks/backendApi";
import { useRouter } from "vue-router";

//url params 데이터
const props = defineProps({
    novelId: {
        type: Number,
        required: true,
    },
});

const router = useRouter();

//에피소드 리스트 무한 스크롤 로드
const scrollProps = reactive({
    pageProps: { number: 0, size: 30 },
    loadMethod: async (page, size) => {
        const loaditems = await episodeApi.getEpisodesByNovel(props.novelId, "recent", page, size);
        return loaditems;
    },
});

//스크롤 메서드, 변수 가져오기
const scrollRef = ref(null);

//작품 정보 불러오기
const novelInfo = ref(undefined);

async function loadNovel() {
    try {
        const data = await novelApi.getNovel(props.novelId);
        novelInfo.value = data;
    } catch (error) {
        console.error("Failed to load novel info: ", error);
    }
}

onMounted(() => {
    loadNovel();
});

//에피소드 생성 페이지 이동
function goToCreate() {
    router.push({ name: "episode-create", params: { id: props.novelId } });
}

//에피소드 삭제 페이지 이동
function goToDelete() {
    //최신화 에피소드 id 가져오기
    const itemList = scrollRef.value.itemList;
    const upToDateEpisodeId = itemList.shift().episodeId;

    router.push({
        name: "episode-delete",
        params: { novelId: props.novelId, episodeId: upToDateEpisodeId },
    });
}
</script>

<style lang="sass" scoped>
.stats
    height: 100%
    display: flex
    flex-flow: column nowrap
    justify-content: space-evenly

.button
    width: 100%
    height: 100%

.episode-list
    th, td
        padding: 10px
</style>
