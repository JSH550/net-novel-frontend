<template>
    <article class="comment">
        <section class="detail">
            <h5 class="nickName" v-if="comment.nickName">{{ comment.nickName }}</h5>
            <h5 v-if="options.type" class="type">{{ commentType }}</h5>
            <p class="timestamp">{{ updatedDate }}</p>
            <p v-if="mode !== editMode.edit" class="content">{{ content }}</p>
            <CommentForm
                v-else
                v-model="contentToUpdate"
                @submit="updateComment"
                button-text="수정"
            ></CommentForm>
        </section>

        <slot></slot>

        <section class="bottom-action">
            <template v-if="options.edit && comment.editable">
                <button class="outline edit" @click="toggleModeRecomment(editMode.edit)">
                    <MessageSquareText :size="16" />수정
                </button>
                <button class="outline delete" @click="deleteComment">
                    <MessageSquareX :size="16" />삭제
                </button>
            </template>
            <template v-if="options.recomment">
                <button
                    class="action-button outline"
                    @click="toggleModeRecomment(editMode.recomment)"
                >
                    <MessageSquareMore :size="16" />답글
                </button>
                <button class="outline" @click="toggleRecommentList">
                    <ChevronDown :size="15" />대댓글
                </button>
            </template>
        </section>

        <section class="recomment-input" v-if="mode === editMode.recomment">
            <CommentForm
                v-model="recommentContent"
                @submit="createRecomment"
                button-text="대댓글"
            ></CommentForm>
        </section>

        <section class="recomment-list" v-if="isOpenRecomment">
            <template v-for="recomment in comment.reCommentList">
                <CommentItemV2
                    :comment="recomment"
                    :comment-id="comment.id"
                    :episode-id="episodeId"
                    :options="{
                        like: true,
                        edit: true,
                        recomment: false,
                        type: false,
                    }"
                    @reload="emits('reload')"
                ></CommentItemV2>
            </template>
        </section>

        <section class="top-action">
            <template v-if="options.like">
                <button class="outline" @click="clickLike">
                    <ThumbsUp :size="13" /> {{ commentLikes }}
                </button>
                <button class="outline" @click="clickDislike">
                    <ThumbsDown :size="13" /> {{ commentDislikes }}
                </button>
            </template>
            <button class="outline" v-if="!comment.editable">신고</button>
        </section>
    </article>
</template>

<script setup>
import CommentForm from "./CommentForm.vue";
import RecommentItem from "./RecommentItem.vue";
import {
    ThumbsUp,
    ThumbsDown,
    MessageSquareMore,
    MessageSquareText,
    MessageSquareX,
    ChevronDown,
} from "lucide-vue-next";

import { formatUtil } from "@/hooks/format";
import { commentApi } from "@/hooks/backendApi";
import { computed, ref } from "vue";

const props = defineProps({
    comment: {
        type: Object,
        required: true,
    },
    commentId: {
        type: Number,
        default: undefined,
    },
    episodeId: {
        type: Number,
        default: 0,
    },
    options: {
        type: Object,
        default: {
            type: false,
            like: true,
            edit: true,
            recomment: true,
        },
    },
});

console.log(props.comment);

//댓글 리스트 재생성 메서드
const emits = defineEmits(["reload"]);

//댓글 작성 날짜 포메팅
const updatedDate = computed(() => {
    return formatUtil.formatRealTime(props.comment?.createdAt);
});

//댓글 유형 포메팅
const commentType = computed(() => {
    switch (props.comment.type) {
        case "COMMENT":
            return "댓글";
        case "RECOMMENT":
            return "대댓글";
        default:
            return "불명";
    }
});

/**
 * 댓글 수정, 삭제 편집 기능
 */

//화면에 표시될 댓글 내용
//댓글 내용은 변경될 수 있으므로 초깃값만 할당하고 변경 가능하게 설정.
//굳이 reload 안해도 변경값만 변수에 넣으면 됨
const content = ref(props.comment.content);

//댓글 수정
const contentToUpdate = ref(props.comment.content);
async function updateComment() {
    try {
        if (contentToUpdate.value.length > 300) {
            const error = Error("cannot post comment content longer than 300 characters");
            error.code = "length";
            throw error;
        }

        if (props.commentId) {
            await commentApi.updateRecomment({
                content: contentToUpdate.value,
                reCommentId: props.comment.id,
                commentId: props.commentId,
            });
        } else {
            await commentApi.updateComment({
                content: contentToUpdate.value,
                commentId: props.comment.id,
                episodeId: props.episodeId,
            });
        }

        content.value = contentToUpdate.value; //변경된 댓글 내용 적용
        mode.value = editMode.none; //작성 form 닫기
    } catch (error) {
        console.error("Failed to update comment: ", error.message);
        if (error.code === "length") {
            alert("댓글은 300자로 이하로만 작성 가능합니다.");
        }
    }
}

//댓글 삭제
async function deleteComment() {
    const result = confirm("정말로 삭제하시겠습니까?");
    if (!result) {
        return;
    }
    console.log({
        reCommentId: props.comment.id,
        commentId: props.comment.commentId,
    });

    try {
        if (props.commentId) {
            await commentApi.deleteRecomment({
                reCommentId: props.comment.id,
                commentId: props.commentId,
            });
        } else {
            await commentApi.deleteComment({
                commentId: props.comment.id,
                episodeId: props.episodeId,
            });
        }
        emits("reload");
    } catch (error) {
        console.error("Failed to delete comment", error.message);
    }
}

/**
 * 좋아요, 싫어요 기능
 */

//댓글 좋아요, 싫어요 데이터 변동 실시간 반명
const commentLikes = computed(() => {
    return props.comment.likes + likeDelta.value;
});
const commentDislikes = computed(() => {
    return props.comment.disLikes + dislikeDelta.value;
});

const likeDelta = ref(0);
const dislikeDelta = ref(0);

//좋아요 버튼 클릭 이벤트
async function clickLike() {
    try {
        const result = await likeToComment("LIKE");
        likeDelta.value += result ? 1 : -1;
    } catch (error) {
        console.error("Failed to like to comment");
    }
}

//싫어요 버튼 클릭 이벤트
async function clickDislike() {
    try {
        const result = await likeToComment("DISLIKE");
        dislikeDelta.value += result ? 1 : -1;
    } catch (error) {
        console.error("Failed to dislike to comment");
    }
}

async function likeToComment(type) {
    console.log(props.commentId);

    //대댓글 id의 commentId가 있으면 대댓글 좋아요 작업
    if (props.commentId) {
        const result = await commentApi.toggleLikeRecomment({
            likeType: type,
            reCommentId: props.comment.id,
        });
        return result;
    }

    //댓글 좋아요 작업
    const result = await commentApi.toggleLike({
        likeType: type,
        commentId: props.comment.id,
    });
    return result;
}

/**
 * 댓글 편집 모드 설정
 */

//3가지 모드: 답글 작성, 댓글 수정, 아무것도 안함
const editMode = Object.freeze({
    none: "none",
    recomment: "recomment",
    edit: "edit",
});

//현재 편집 모드 상태
const mode = ref(editMode.none);
function toggleModeRecomment(targetMode) {
    if (mode.value === targetMode) {
        mode.value = editMode.none;
    } else {
        mode.value = targetMode;
    }
}

/**
 * 대댓글 기능
 */
//대댓글 열고 접기
const isOpenRecomment = ref(false); //기본 접기 상태 false
function toggleRecommentList() {
    isOpenRecomment.value = !isOpenRecomment.value;
}

//대댓글 입력값
const recommentContent = ref("");

//대댓글 작성
async function createRecomment() {
    try {
        if (recommentContent.value.length > 300) {
            const error = Error("cannot post recomment content longer than 300 characters");
            error.code = "length";
            throw error;
        }

        await commentApi.createRecomment({
            content: recommentContent.value,
            commentId: props.comment.id,
        });
        recommentContent.value = "";
        mode.value = editMode.none; //작성 form 닫기
        emits("reload");
    } catch (error) {
        console.error("Failed to create recomment: ", error.message);
        if (error.code === "length") {
            alert("대댓글은 300자로 이하로만 작성 가능합니다.");
        }
    }
}
</script>

<style scoped lang="sass">
.comment
    position: relative
    margin: 0
    padding: 10px

.detail
    margin-bottom: 0.8rem

    .nickName
        display: inline-block
        font-size: 0.8em
        font-weight: bold
        margin-right: 0.5rem
        margin-bottom: 0.5rem

    .type
        display: inline
        font-size: 0.8rem
        margin-right: 0.5rem
        margin-bottom: 0.5rem

    .timestamp
        display: inline
        font-size: 0.6rem
        font-weight: normal
        margin-bottom: 0.5rem

    .content
        width: 90%
        font-size: 0.8rem
        white-space: pre-wrap


section.recomment-input
    margin: 0
    margin-left: 2rem
    margin-bottom: 0.7rem
    margin-top: 1rem


    form
        position: relative
        margin: 0

        display: flex
        align-items: stretch

        textarea
            font-size: 0.8rem

        input
            height: auto
            padding: 0 1rem
            font-size: 0.8rem
            display: flex
            align-items: center



.recomment-list
    margin: 0
    margin-left: 2rem
    margin-top: 1rem

    display: flex
    flex-flow: column wrap
    gap: 8px



.top-action
    position: absolute
    top: 15px
    right: 15px
    display: flex

    button
        background: none
        border: none
        cursor: pointer
        font-size: 0.8rem

        display: flex
        align-items: center
        gap: 3px

.bottom-action
    position: relative
    margin: 0

    display: flex
    justify-content: end

    button
        background: none
        border: none
        cursor: pointer
        font-size: 0.7rem

        display: flex
        align-items: center
        gap: 3px

    button.edit
        color: green

    button.delete
        color: red
</style>
